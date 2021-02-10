const { assert, formatKeyValueObject, isDynamoDB, isPlainObject, marshall, unmarshall } = require('../utils');

const transactables = {

  async get(handler, key, opts = undefined) {
    const { tableName } = this;
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(opts === undefined || isPlainObject(opts), new TypeError('Expected opts to be a plain object'));
    opts = { ...opts };

    assert([ 'boolean', 'undefined' ].includes(typeof opts.consistentRead),
      new TypeError('Expected opts.consistentRead to be a boolean'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ConsistentRead: opts.consistentRead,
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return value || null;
  },

  async set(handler, key, value, opts = undefined) {
    const { tableName } = this;
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof value === 'string' || typeof value === 'number', new TypeError('Expected value to be a string or number'));
    assert(opts === undefined || isPlainObject(opts), new TypeError('Expected opts to be a plain object'));

    opts = { ...opts };
    assert(!opts.ex || typeof opts.ex === 'number', new TypeError('Expected EX to be a number'));
    assert(!opts.exat || typeof opts.exat === 'number', new TypeError('Expected EXAT to be a number'));
    assert(opts.nx === undefined || typeof opts.nx === 'boolean', new TypeError('Expected NX to be a boolean'));
    assert(opts.xx === undefined || typeof opts.xx === 'boolean', new TypeError('Expected XX to be a boolean'));
    assert(!(opts.ex && opts.exat), new Error('EX / EXAT are exclusive'));
    assert(!(opts.nx && opts.xx), new Error('NX / XX are exclusive'));

    assert(!opts.px, new Error('Millisecond expiry is not supported by DynamoDB'));
    assert(!opts.pxat, new Error('Millisecond expiry is not supported by DynamoDB'));

    const ttl = opts.exat || opts.ex ? Math.floor(Date.now / 1000) + opts.ex : null || undefined;

    await handler({
      Put: {
        TableName: tableName,
        Item: marshall({ key, value, ttl }),
      },
    });

    return true;
  },

  async incrby(handler, key, incr) {
    const { tableName } = this;
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof incr === 'number', new TypeError('Expected incr to be a number'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = if_not_exists(#value, :start) + :incr',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': 0, ':type': 'N', ':incr': incr }),
      },
    });

    return true;
  },
  async decrby(handler, key, decr) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof decr === 'number', new TypeError('Expected decr to be a number'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = if_not_exists(#value, :start) - :decr',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': 0, ':type': 'N', ':decr': decr }),
      },
    });

    return true;
  },

  incr(handler, key) {
    return transactables.incrby.call(this, handler, key, 1);
  },
  decr(handler, key) {
    return transactables.decrby.call(this, handler, key, 1);
  },

};

const methods = {

  async mget(...items) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(Array.isArray(items), new TypeError('Expected keys to be an array'));
    assert(items.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

    if (items.length) {
      const TransactItems = items.map(key => {
        assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
        return {
          Get: {
            TableName: tableName,
            Key: marshall({ key }),
          },
        };
      });

      const results = await client.transactGetItems({ TransactItems }).promise();

      assert(results && Array.isArray(results.Responses), new Error('Expected transactGetItems response to be an array'));
      items = results.Responses.map(({ Item }) => {
        if (Item) {
          Item = unmarshall(Item);
          return Item.value || null;
        } else {
          return null;
        }
      });
    }

    return items;
  },

  async mset(...items) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(Array.isArray(items), new TypeError('Expected keys to be an array'));

    items = formatKeyValueObject(items);
    assert(items.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

    if (items.length) {
      const TransactItems = items.map(({ key, value }) => {
        assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
        return {
          Put: {
            TableName: tableName,
            Item: marshall({ key, value }),
          },
        };
      });

      await client.transactWriteItems({ TransactItems }).promise();
    }

    return true;
  },

  async strlen(key) {
    assert(typeof this.get === 'function', new TypeError('Expected key to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const value = await this.get(key);
    return typeof value === 'string' ? value.length : 0;
  },

};

module.exports = { methods, transactables };
