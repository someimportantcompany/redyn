const { assert, isPlainObject, marshall, unmarshall } = require('../utils');

const transactables = {

  async rpush(handler, key, ...elements) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(elements), new TypeError('Expected elements to be an array'));
    assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

    const result = await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = list_append(if_not_exists(#value, :start), :append)',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':append': elements }),
        ReturnValues: 'UPDATED_NEW',
      },
    });

    if (handler.isTransaction) {
      return true;
    } else {
      const { value } = result && isPlainObject(result.Attributes) ? unmarshall(result.Attributes) : {};
      return Array.isArray(value) ? value.length : 0;
    }
  },

  async lpush(handler, key, ...elements) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(elements), new TypeError('Expected elements to be an array'));
    assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

    elements = elements.reverse();

    const result = await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = list_append(:prepend, if_not_exists(#value, :start))',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':prepend': elements }),
        ReturnValues: 'UPDATED_NEW',
      },
    });

    if (handler.isTransaction) {
      return true;
    } else {
      const { value } = result && isPlainObject(result.Attributes) ? unmarshall(result.Attributes) : {};
      return Array.isArray(value) ? value.length : 0;
    }
  },

  async rpushx(handler, key, ...elements) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(elements), new TypeError('Expected elements to be an array'));
    assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

    try {
      const result = await handler({
        Update: {
          TableName: tableName,
          Key: marshall({ key }),
          ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
          UpdateExpression: 'SET #value = list_append(if_not_exists(#value, :start), :append)',
          ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
          ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':append': elements }),
          ReturnValues: 'UPDATED_NEW',
        },
      });

      if (handler.isTransaction) {
        return true;
      } else {
        const { value } = result && isPlainObject(result.Attributes) ? unmarshall(result.Attributes) : {};
        return Array.isArray(value) ? value.length : 0;
      }
    } catch (err) {
      assert(err.name === 'ConditionalCheckFailedException', err);
      return false;
    }
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
      const result = await handler({
        Update: {
          TableName: tableName,
          Key: marshall({ key }),
          ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
          UpdateExpression: 'SET #value = list_append(:prepend, if_not_exists(#value, :start))',
          ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
          ExpressionAttributeValues: marshall({ ':start': [], ':type': 'L', ':prepend': elements }),
          ReturnValues: 'UPDATED_NEW',
        },
      });

      if (handler.isTransaction) {
        return true;
      } else {
        const { value } = result && isPlainObject(result.Attributes) ? unmarshall(result.Attributes) : {};
        return Array.isArray(value) ? value.length : 0;
      }
    } catch (err) {
      assert(err.name === 'ConditionalCheckFailedException', err);
      return false;
    }
  },

  async lindex(handler, key, i, opts = undefined) {
    const { tableName } = this;
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof i === 'number', new TypeError('Expected i to be a number'));
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
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    return Array.isArray(value) && value.hasOwnProperty(i) ? value[i] : null;
  },

  async llen(handler, key, opts = undefined) {
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
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    return Array.isArray(value) ? value.length : null;
  },

  async lrange(handler, key, start, end, opts = undefined) {
    const { tableName } = this;
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof start === 'number', new TypeError('Expected start to be a number'));
    assert(typeof end === 'number', new TypeError('Expected end to be a number'));
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
    assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), {
      code: 'WRONGTYPE'
    });

    if (Array.isArray(value) && value.length && end < 0) {
      end = value.length - end;
    }

    // LRANGE list 0 10 will return 11 elements, that is, the rightmost item is included
    return Array.isArray(value) ? value.slice(start, end + 1) : [];
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
        Key: marshall({ key }),
        ConditionExpression: 'attribute_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: `SET #value[${i}] = :value`,
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':type': 'L', ':value': value }),
      },
    });

    return true;
  },

};

module.exports = { transactables };
