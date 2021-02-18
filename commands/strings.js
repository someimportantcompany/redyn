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
        ...(handler.isTransaction ? {} : {
          ConsistentRead: opts.consistentRead,
        }),
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return [ 'string', 'number' ].includes(typeof value) ? value : null;
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

  async strlen(handler, key, opts) {
    const { get } = transactables;
    const value = await get.call(this, handler, key, opts);
    return value ? `${value}`.length : 0;
  },

  async incrby(handler, key, incr) {
    const { tableName } = this;
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof incr === 'number', new TypeError('Expected incr to be a number'));

    const result = await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = if_not_exists(#value, :start) + :incr',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': 0, ':type': 'N', ':incr': incr }),
        ReturnValues: 'UPDATED_NEW',
      },
    });

    if (handler.isTransaction) {
      return true;
    } else {
      const { value } = result && isPlainObject(result.Attributes) ? unmarshall(result.Attributes) : {};
      return value || null;
    }
  },
  async decrby(handler, key, decr) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof decr === 'number', new TypeError('Expected decr to be a number'));

    const result = await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = if_not_exists(#value, :start) - :decr',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': 0, ':type': 'N', ':decr': decr }),
        ReturnValues: 'UPDATED_NEW',
      },
    });

    if (handler.isTransaction) {
      return true;
    } else {
      const { value } = result && isPlainObject(result.Attributes) ? unmarshall(result.Attributes) : {};
      return value || null;
    }
  },

  incr(handler, key) {
    const { incrby } = transactables;
    return incrby.call(this, handler, key, 1);
  },
  decr(handler, key) {
    const { decrby } = transactables;
    return decrby.call(this, handler, key, 1);
  },

};

const methods = {

  async getdel(key) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const params = {
      TableName: tableName,
      Key: marshall({ key }),
    };

    const result = await client.getItem(params).promise();

    const { value } = result && result.Item ? result.Item : {};
    const isStringValue = value && value.S && typeof value.S === 'string';
    assert(!value || isStringValue, new Error(`Expected ${key} to hold a string value`));

    if (isStringValue) {
      await client.deleteItem(params).promise();
    }

    return isStringValue ? value.S : null;
  },

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

};

module.exports = { methods, transactables };
