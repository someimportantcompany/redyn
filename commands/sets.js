const {
  GetItemCommand, PutItemCommand,
  TransactGetItemsCommand, TransactWriteItemsCommand,
} = require('@aws-sdk/client-dynamodb');

const { assert, isDynamoDB, isPlainObject, isSet, marshall, unmarshall } = require('../utils');
/* eslint-disable no-invalid-this */

function getSetType(member) {
  if (member instanceof Buffer) {
    return 'BS';
  } else {
    const type = typeof member;
    if (type === 'number') {
      return 'NS';
    } else if (type === 'string') {
      return 'SS';
    } else {
      throw new TypeError('Set members must be a string, number or Buffer');
    }
  }
}

const transactables = {

  async sadd(handler, key, ...members) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(members) && members.length, new TypeError('Expected an array of members'));

    const type = getSetType(members[0]);
    members.forEach(v => assert(getSetType(v) === type, new TypeError(`Expected all members to be a ${type}`)));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_not_exists(#key) OR attribute_type(#value, :type)',
        UpdateExpression: 'ADD #value :members',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':type': type, ':members': new Set(members) }),
      },
    });

    return true;
  },

  async scard(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ConsistentRead: true,
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isSet(value) ? value.size : 0;
  },

  async sismember(handler, key, member) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    getSetType(member);

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ConsistentRead: true,
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return isSet(value) && value.has(member);
  },

  async smismember(handler, key, ...members) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(Array.isArray(members) && members.length, new TypeError('Expected members to be a string'));
    members.forEach(member => assert(getSetType(member), new TypeError('Expected each member to be a string')));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ConsistentRead: true,
      },
    });

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return members.map(member => isSet(value) && value.has(member));
  },

  async srem(handler, key, ...members) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(Array.isArray(members) && members.length, new TypeError('Expected an array of members'));

    const type = getSetType(members[0]);
    members.forEach(v => assert(getSetType(v) === type, new TypeError(`Expected all members to be a ${type}`)));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
        UpdateExpression: 'DELETE #value :members',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
        ExpressionAttributeValues: marshall({ ':type': type, ':members': new Set(members) }),
      },
    });

    return true;
  },

};

const methods = {

  async sdiff(...keys) {
    return (await setfetch.call(this, keys)).reduce((first, set) => first.filter(a => !set.includes(a)));
  },
  sdiffstore(destination, ...keys) {
    return setstore.call(this, methods.sdiff, destination, ...keys);
  },

  async sinter(...keys) {
    return (await setfetch.call(this, keys)).reduce((first, set) => first.filter(a => set.includes(a)));
  },
  sinterstore(destination, ...keys) {
    return setstore.call(this, methods.sinter, destination, ...keys);
  },

  async smembers(key) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await client.send(new GetItemCommand({
      TableName: tableName,
      Key: marshall({ key }),
      ConsistentRead: true,
    }));

    const { value } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    return [ ...value ];
  },

  async smove(source, destination, member) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof source === 'string' && source.length, new TypeError('Expected source to be a string'));
    assert(typeof destination === 'string' && destination.length, new TypeError('Expected destination to be a string'));

    const type = getSetType(member);

    const TransactItems = [
      {
        Update: {
          TableName: tableName,
          Key: marshall({ key: source }),
          ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type) AND contains(#value, :member)',
          UpdateExpression: 'DELETE #value :members',
          ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
          ExpressionAttributeValues: marshall({ ':type': type, ':member': member, ':members': new Set([ member ]) }),
        },
      },
      {
        Update: {
          TableName: tableName,
          Key: marshall({ key: destination }),
          ConditionExpression: 'attribute_exists(#key) AND attribute_type(#value, :type)',
          UpdateExpression: 'ADD #value :members',
          ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
          ExpressionAttributeValues: marshall({ ':type': type, ':members': new Set([ member ]) }),
        },
      },
    ];

    await client.send(new TransactWriteItemsCommand({ TransactItems }));

    return true;
  },

  async sunion(...keys) {
    const result = (await setfetch.call(this, keys)).reduce((first, set) => ([ ...first, ...set ]));
    return [ ...(new Set(result)) ];
  },
  sunionstore(destination, ...keys) {
    return setstore.call(this, methods.sunion, destination, ...keys);
  },

};

async function setfetch(keys) {
  const { client, tableName } = this;
  assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
  assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
  assert(Array.isArray(keys) && keys.length >= 1, new Error('Expected keys to be an array'));
  assert(keys.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

  const TransactItems = keys.map(key => ({
    Get: {
      TableName: tableName,
      Key: marshall({ key }),
    },
  }));

  const result = await client.send(new TransactGetItemsCommand({ TransactItems }));
  assert(result && Array.isArray(result.Responses), new TypeError('Expected responses to be an array'));

  return result.Responses.map(({ Item }) => {
    if (Item) {
      Item = unmarshall(Item);
      return isSet(Item.value) ? [ ...Item.value ] : [];
    } else {
      return [];
    }
  });
}
async function setstore(method, destination, ...keys) {
  const { client, tableName } = this;
  assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
  assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
  assert(typeof destination === 'string' && destination.length, new TypeError('Expected destination to be a string'));

  const value = await method.call(this, ...keys);
  assert(Array.isArray(value), new Error('Expected result value to be an array'));

  await client.send(new PutItemCommand({
    TableName: tableName,
    Item: marshall({ key: destination, value: new Set(value) }),
    ReturnValues: 'NONE',
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
  }));

  return value.length;
}

module.exports = { methods, transactables };
