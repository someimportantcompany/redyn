const { assert, formatKeyValueObject, isDynamoDB, isPlainObject, marshall, unmarshall } = require('../utils');

const index = 0;

const transactables = {

  async hget(handler, key, field) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof field === 'string' && field.length, new TypeError('Expected field to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ProjectionExpression: '#key, #value.#field',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value', '#field': field },
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isPlainObject(value) ? (value[field] || null) : null;
  },

  async hgetall(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ProjectionExpression: '#key, #value',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isPlainObject(value) ? value : null;
  },

  async hincrby(handler, key, field, incr) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof field === 'string' && field.length, new TypeError('Expected field to be a string'));
    assert(typeof incr === 'number', new TypeError('Expected incr to be a number'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
        UpdateExpression: 'SET #value.#field = if_not_exists(#value.#field, :start) + :incr',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value', '#field': field },
        ExpressionAttributeValues: marshall({ ':start': 0, ':type': 'M', ':incr': incr }),
      },
    });

    return true;
  },

  async hkeys(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ProjectionExpression: '#key, #value',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isPlainObject(value) ? Object.keys(value) : null;
  },

  async hlen(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ProjectionExpression: '#key, #value',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isPlainObject(value) ? Object.keys(value).length : 0;
  },

  async hmget(handler, key, ...fields) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(fields) && fields.length, new TypeError('Expected an array of fields'));
    fields.forEach(field => {
      assert(typeof field === 'string' && field.length, new TypeError('Expected each field to be a string'));
    });

    const { expression, names } = fields.reduce((r, field, i) => {
      r.expression.push(`#value.#field${i}`);
      r.names[`#field${i}`] = field;
      return r;
    }, {
      expression: [ '#key' ],
      names: {},
    });

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ProjectionExpression: expression.join(', '),
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value', ...names },
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isPlainObject(value) ? fields.map(field => value[field] || null) : fields.map(() => null);
  },

  async hstrlen(handler, key, field) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof field === 'string' && field.length, new TypeError('Expected field to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ProjectionExpression: '#key, #value.#field',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value', '#field': field },
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isPlainObject(value) && typeof value[field] === 'string' ? value[field].length : 0;
  },

  async hvals(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ProjectionExpression: '#key, #value',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isPlainObject(value) ? Object.values(value) : null;
  },

};

const methods = {

  async hset(key, ...items) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(items) && items.length, new TypeError('Expected an array of items'));
    items = formatKeyValueObject(items);
    assert(items.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

    try {
      const { expression, names, values } = items.reduce((r, { key: k, value }, i) => {
        r.expression.push(`#value.#key${i} = :value${i}`);
        r.names[`#key${i}`] = k;
        r.values[`:value${i}`] = value;
        return r;
      }, {
        expression: [],
        names: {},
        values: {},
      });

      const params = {
        TableName: tableName,
        Key: marshall({ key, index }),
        ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
        UpdateExpression: `SET ${expression.join(', ')}`,
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value', ...names },
        ExpressionAttributeValues: marshall({ ':type': 'M', ...values }),
      };

      await client.updateItem(params).promise();
    } catch (err) {
      assert(err.code === 'ConditionalCheckFailedException', err);

      const params = {
        TableName: tableName,
        Key: marshall({ key, index }),
        ConditionExpression: 'attribute_not_exists(#key)',
        UpdateExpression: 'SET #value = :values',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({
          ':values': items.reduce((r, { key: k, value: v }) => ({ ...r, [k]: v }), {}),
        }),
      };

      await client.updateItem(params).promise();
    }

    return true;
  },

  hmset(key, items) {
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(isPlainObject(items), new TypeError('Expected items to be a plain object'));
    return methods.hset.call(this, key, items);
  },

};

module.exports = { methods, transactables };
