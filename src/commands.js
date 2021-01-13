const AWS = require('aws-sdk');
const { assert, buildTTL, isPlainObject, marshall, unmarshall } = require('./utils');

const commands = {

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
        Key: marshall({ key, index: 0 }),
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

    assert(!opts.px, new Error('Millisecond expiry is not supported by DynamoDB'));
    assert(!(opts.expiresIn && opts.ex), new TypeError('expiresIn & ex are exclusive'));

    const ttl = buildTTL(opts.expiresIn) || buildTTL(opts.ex) || null;

    await handler({
      Put: {
        TableName: tableName,
        Item: marshall({ key, index: 0, ttl, value }),
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
        Key: marshall({ key, index: 0 }),
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
        Key: marshall({ key, index: 0 }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = if_not_exists(#value, :start) - :decr',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': 0, ':type': 'N', ':decr': decr }),
      },
    });

    return true;
  },

  incr(handler, key) {
    return commands.incrby.call(this, handler, key, 1);
  },
  decr(handler, key) {
    return commands.decrby.call(this, handler, key, 1);
  },

  async rpush(handler, key, ...elements) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(elements), new TypeError('Expected elements to be an array'));
    assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key, index: 0 }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = list_append(if_not_exists(#value, :start), :append)',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':append': elements }),
      },
    });

    return true;
  },
  async lpush(handler, key, ...elements) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(elements), new TypeError('Expected elements to be an array'));
    assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

    elements = elements.reverse();

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key, index: 0 }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = list_append(:prepend, if_not_exists(#value, :start))',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':prepend': elements }),
      },
    });

    return true;
  },
  async rpushx(handler, key, ...elements) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(elements), new TypeError('Expected elements to be an array'));
    assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

    try {
      await handler({
        Update: {
          TableName: tableName,
          Key: marshall({ key, index: 0 }),
          ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
          UpdateExpression: 'SET #value = list_append(if_not_exists(#value, :start), :append)',
          ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
          ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':append': elements }),
        },
      });
    } catch (err) {
      if (err.name !== 'ConditionalCheckFailedException') {
        throw err;
      }
    }

    return true;
  },
  async lpushx(handler, key, ...elements) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(elements), new TypeError('Expected elements to be an array'));
    assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

    elements = elements.reverse();

    try {
      await handler({
        Update: {
          TableName: tableName,
          Key: marshall({ key, index: 0 }),
          ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
          UpdateExpression: 'SET #value = list_append(:prepend, if_not_exists(#value, :start))',
          ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
          ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':prepend': elements }),
        },
      });
    } catch (err) {
      if (err.name !== 'ConditionalCheckFailedException') {
        throw err;
      }
    }

    return true;
  },
  async lset(handler, key, index, value) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof index === 'number', new TypeError('Expected index to be a number'));
    assert(typeof value === 'string' && value.length, new TypeError('Expected value to be a string'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key, index: 0 }),
        ConditionExpression: 'attribute_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: `SET #value[${index}] = :value`,
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':type': 'L', ':value': value }),
      },
    });

    return true;
  },

  async sadd(handler, key, ...members) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof index === 'number', new TypeError('Expected index to be a number'));
    assert(typeof value === 'string' && value.length, new TypeError('Expected value to be a string'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key, index: 0 }),
        ConditionExpression: 'attribute_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: `SET #value[${index}] = :value`,
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':type': 'L', ':value': value }),
      },
    });

    return true;
  },

};

const standalone = {
  async mget(...items) {
    const { client, tableName } = this;
    assert(client instanceof AWS.DynamoDB, 'Expected deleteThenCreateTable dynamodb to be an instance of AWS.DynamoDB');
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(Array.isArray(items), new TypeError('Expected keys to be an array'));
    assert(items.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

    if (items.length) {
      const TransactItems = items.map(key => {
        assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
        return {
          Get: {
            TableName: tableName,
            Key: marshall({ key, index: 0 }),
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
    assert(client instanceof AWS.DynamoDB, 'Expected deleteThenCreateTable dynamodb to be an instance of AWS.DynamoDB');
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(Array.isArray(items), new TypeError('Expected keys to be an array'));

    if (Array.isArray(items) && items.length === 1 && isPlainObject(items[0])) {
      items = Object.keys(items[0]).map(key => ({ key, value: items[0][key] }));
    } else {
      assert(Array.isArray(items), new TypeError('Expected keys to be an array'));
      assert(items.length % 2 === 0, new TypeError('Expected every key to have a value'));

      items = items.reduce((r, v, i) => {
        if (i % 2 === 0) {
          r.push({ key: v });
        } else {
          r[r.length - 1].value = v;
        }
        return r;
      }, []);
    }

    assert(items.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

    if (items.length) {
      const TransactItems = items.map(({ key, value }) => {
        assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
        return {
          Put: {
            TableName: tableName,
            Item: marshall({ key, index: 0, value }),
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

  async lrange(key, start, stop) {
    const { client, tableName } = this;
    assert(client instanceof AWS.DynamoDB, 'Expected deleteThenCreateTable dynamodb to be an instance of AWS.DynamoDB');
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof start === 'number', new TypeError('Expected start to be a number'));
    assert(typeof stop === 'number', new TypeError('Expected stop to be a number'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index: 0 }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    if (Array.isArray(value) && value.length && stop < 0) {
      stop = value.length - stop;
    }

    // LRANGE list 0 10 will return 11 elements, that is, the rightmost item is included
    return Array.isArray(value) ? value.slice(start, stop + 1) : [];
  },
  async lindex(key, index) {
    const { client, tableName } = this;
    assert(client instanceof AWS.DynamoDB, 'Expected deleteThenCreateTable dynamodb to be an instance of AWS.DynamoDB');
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof index === 'number', new TypeError('Expected index to be a number'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index: 0 }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    return Array.isArray(value) ? (value[index] || null) : null;
  },
  async llen(key) {
    const { client, tableName } = this;
    assert(client instanceof AWS.DynamoDB, 'Expected deleteThenCreateTable dynamodb to be an instance of AWS.DynamoDB');
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof index === 'number', new TypeError('Expected index to be a number'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index: 0 }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    return Array.isArray(value) ? value.length : null;
  },

  async flushall() {
    const { client, tableName } = this;
    assert(client instanceof AWS.DynamoDB, 'Expected deleteThenCreateTable dynamodb to be an instance of AWS.DynamoDB');
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));

    const params = {
      TableName: tableName,
      ProjectionExpression: '#key, #index',
      ExpressionAttributeNames: { '#key': 'key', '#index': 'index' },
    };

    let startKey = null;
    let hasMore = true;

    while (hasMore) {
      const result = await client.scan({ ...params, ExclusiveStartKey: startKey }).promise();
      startKey = result ? result.LastEvaluatedKey : null;
      hasMore = Boolean(result && result.LastEvaluatedKey);

      const TransactItems = ((result && Array.isArray(result.Items)) ? result.Items : []).map(Key => ({
        TableName: tableName,
        Key,
      }));
      if (TransactItems.length) {
        await client.transactWriteItems({ TransactItems }).promise();
      }
    }

    return true;
  },
};

module.exports = {
  commands,
  standalone,
};
