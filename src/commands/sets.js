const { assert, isDynamoDB, isPlainObject, isSet, marshall, unmarshall } = require('../utils');
/* eslint-disable no-invalid-this */

const index = 0;

const transactables = {

  async sadd(handler, key, ...members) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(members) && members.length, new TypeError('Expected an array of members'));

    const type = typeof members[0];
    assert([ 'string', 'number' ].includes(type), new TypeError('Expected all members to be a string or number'));
    members.forEach(value => assert(typeof value === type, new TypeError(`Expected all members to be a ${type}`)));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key, index }),
        ConditionExpression: 'attribute_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'ADD #value :members',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':type': type === 'number' ? 'NS' : 'SS', ':members': new Set(members) }),
      },
    });

    return true;
  },

};

const methods = {

  async scard(key) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected dynamodb to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};

    return isSet(value) ? value.size : 0;
  },

  async sismember(key, member) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected dynamodb to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};

    return isSet(value) && value.has(member);
  },

  async smembers(key) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected dynamodb to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const params = {
      TableName: tableName,
      Key: marshall({ key, index }),
      ConsistentRead: true,
    };

    const result = await client.getItem(params).promise();
    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};

    return [ ...value ];
  },

  async sdiff(...keys) {
    return (await setfetch.call(this, keys)).reduce((first, set) => first.filter(a => !set.includes(a)));
  },
  async sinter(...keys) {
    return (await setfetch.call(this, keys)).reduce((first, set) => first.filter(a => set.includes(a)));
  },
  async sunion(...keys) {
    return (await setfetch.call(this, keys)).reduce((first, set) => ([ ...(new Set([ ...first, ...set ])) ]));
  },
  sdiffstore(destination, ...keys) {
    return setstore.call(this, methods.sdiff, destination, ...keys);
  },
  sinterstore(destination, ...keys) {
    return setstore.call(this, methods.sinter, destination, ...keys);
  },
  sunionstore(destination, ...keys) {
    return setstore.call(this, methods.sunion, destination, ...keys);
  },

};

async function setfetch(keys) {
  const { client, tableName } = this;
  assert(isDynamoDB(client), new TypeError('Expected dynamodb to be an instance of AWS.DynamoDB'));
  assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
  assert(Array.isArray(keys) && keys.length >= 1, new Error('Expected keys to be an array'));
  assert(keys.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

  const TransactItems = keys.map(key => ({
    TableName: tableName,
    Key: marshall({ key, index }),
  }));

  const result = await client.transactGetItems({ TransactItems }).promise();
  assert(result && Array.isArray(result.Responses), new TypeError('Expected responses to be an array'));

  return result.Responses.map(({ Item }) => Item ? unmarshall(Item) : null);
}
async function setstore(method, destination, ...keys) {
  const { client, tableName } = this;
  assert(isDynamoDB(client), new TypeError('Expected dynamodb to be an instance of AWS.DynamoDB'));
  assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
  assert(typeof destination === 'string' && destination.length, new TypeError('Expected destination to be a string'));

  const value = method.call(this, ...keys);

  const params = {
    TableName: tableName,
    Item: marshall({ key: destination, index, value: new Set(value) }),
  };

  await client.putItem(params).promise();

  return value.length;
}

module.exports = { methods, transactables };
