const { assert, isDynamoDB, isPlainObject, marshall, unmarshall } = require('../utils');

const index = 0;

const transactables = {

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
        Key: marshall({ key, index }),
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
        Key: marshall({ key, index }),
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
          Key: marshall({ key, index }),
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
          Key: marshall({ key, index }),
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

  async lset(handler, key, i, value) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof i === 'number', new TypeError('Expected index to be a number'));
    assert(typeof value === 'string' && value.length, new TypeError('Expected value to be a string'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ConditionExpression: 'attribute_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: `SET #value[${i}] = :value`,
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':type': 'L', ':value': value }),
      },
    });

    return true;
  },

};

const methods = {

  async lrange(key, start, stop) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof start === 'number', new TypeError('Expected start to be a number'));
    assert(typeof stop === 'number', new TypeError('Expected stop to be a number'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index }),
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

  async lindex(key, i) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof i === 'number', new TypeError('Expected index to be a number'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    return Array.isArray(value) ? (value[i] || null) : null;
  },

  async llen(key) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof index === 'number', new TypeError('Expected index to be a number'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    return Array.isArray(value) ? value.length : null;
  },

};

module.exports = { methods, transactables };
