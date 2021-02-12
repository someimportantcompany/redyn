const { assert, isDynamoDB, isPlainObject, marshall, unmarshall } = require('../utils');

const transactables = {

  async del(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    await handler({
      Delete: {
        TableName: tableName,
        Key: marshall({ key }),
      },
    });

    return true;
  },

  // async dump(handler, key) {
  //   const { tableName } = this;
  //   assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
  //   assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
  //   assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  //
  //   const result = await handler({
  //     Get: {
  //       TableName: tableName,
  //       Key: marshall({ key }),
  //     },
  //   });
  //
  //   return result && isPlainObject(result.Item)
  //     ? Buffer.from(JSON.stringify(result.Item), 'utf8').toString('base64')
  //     : null;
  // },

  async exists(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ProjectionExpression: '#key',
        ExpressionAttributeNames: { '#key': 'key' },
      },
    });

    return result && isPlainObject(result.Item) && result.Item.key ? 1 : 0;
  },

  async expire(handler, key, seconds) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof seconds === 'number' && seconds >= 0, new TypeError('Expected seconds to be an unsigned number'));

    const result = await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_exists(#key)',
        UpdateExpression: 'SET #ttl = :ttl',
        ExpressionAttributeNames: { '#key': 'key', '#ttl': 'ttl' },
        ExpressionAttributeValues: marshall({ ':ttl': Math.floor(Date.now() / 1000) + seconds }),
      },
    });

    return result && isPlainObject(result.Item) && result.Item.key;
  },

  async expireAt(handler, key, timestamp) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(timestamp instanceof Date, new TypeError('Expected timestamp to be a Date'));

    const result = await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_exists(#key)',
        UpdateExpression: 'SET #ttl = :ttl',
        ExpressionAttributeNames: { '#key': 'key', '#ttl': 'ttl' },
        ExpressionAttributeValues: marshall({ ':ttl': Math.floor(timestamp.getTime() / 1000) }),
      },
    });

    return result && isPlainObject(result.Item) && result.Item.key;
  },

  async persist(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_exists(#key)',
        UpdateExpression: 'REMOVE #ttl',
        ExpressionAttributeNames: { '#key': 'key', '#ttl': 'ttl' },
      },
    });

    return true;
  },

  async rename(handler, key, newKey) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof newKey === 'string' && newKey.length, new TypeError('Expected newKey to be a string'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_exists(#key)',
        UpdateExpression: 'SET #key = :newKey',
        ExpressionAttributeNames: { '#key': 'key' },
        ExpressionAttributeValues: marshall({ ':newKey': newKey }),
      },
    });

    return true;
  },

  async renamenx(handler, key, newKey) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof newKey === 'string' && newKey.length, new TypeError('Expected newKey to be a string'));

    await handler({
      Update: {
        TableName: tableName,
        Key: marshall({ key }),
        ConditionExpression: 'attribute_exists(#key) AND attribute_not_exists(#newKey)',
        UpdateExpression: 'SET #key = :newKey',
        ExpressionAttributeNames: { '#key': key, '#newKey': newKey },
        ExpressionAttributeValues: marshall({ ':newKey': newKey }),
      },
    });

    return true;
  },

  async ttl(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ProjectionExpression: '#key,#ttl',
        ExpressionAttributeNames: { '#key': 'key', '#ttl': 'ttl' },
      },
    });

    const { ttl } = result && isPlainObject(result.Item) ? unmarshall(result.Item) : {};
    const now = Math.floor(Date.now() / 1000);
    return ttl && ttl > now ? ttl - now : -1;
  },

  async type(handler, key) {
    const { tableName } = this;
    assert(typeof handler === 'function', new TypeError('Expected handler to be a function'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));
    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

    const result = await handler({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ProjectionExpression: '#key,#value',
        ExpressionAttributeNames: { '#key': 'key', '#value': 'value' },
      },
    });

    const type = result && isPlainObject(result.Item) && isPlainObject(result.Item.value)
      ? Object.keys(result.Item.value).shift()
      : null;
    switch (type) {
      case 'S': case 'N': return 'string';
      case 'SS': case 'NS': case 'BS': return 'set';
      case 'L': return 'list';
      case 'M': return 'hash';
      default: return null;
    }
  },

};

const methods = {

  async copy(source, destination, opts = undefined) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));

    assert(typeof source === 'string' && source.length, new TypeError('Expected source to be a string'));
    assert(typeof destination === 'string' && destination.length, new TypeError('Expected destination to be a string'));
    assert(opts === undefined || isPlainObject(opts), new TypeError('Expected opts to be a plain object'));
    opts = { ...opts };

    assert(!opts.destinationDb || typeof opts.destinationDb === 'string',
      new TypeError('Expected opts.destinationDb to be a string'));
    assert(opts.replace === undefined || typeof opts.replace === 'boolean',
      new TypeError('Expected opts.replace to be a boolean'));

    const result = await client.getItem({
      TableName: tableName,
      Key: marshall({ key: source }),
      ConsistentRead: true,
    });

    if (result && result.Item && result.Item.value) {
      const params = {
        TableName: opts.destinationDb || tableName,
        Item: { key: { S: destination }, value: result.Item.value },
      };

      if (!opts.replace) {
        params.ConditionExpression = 'attribute_not_exists(#key)';
        params.ExpressionAttributeNames = { '#key': 'key' };
      }

      await client.putItem(params).promise();

      return true;
    } else {
      return false;
    }
  },

  async del(...keys) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));

    assert(Array.isArray(keys) && keys.length, new TypeError('Expected an array of keys'));
    assert(keys.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));
    keys.forEach(key => assert(typeof key === 'string' && key.length, new TypeError('Expected each key to be a string')));

    const TransactItems = keys.map(key => ({
      Delete: {
        TableName: tableName,
        Key: marshall({ key }),
      },
    }));
    if (TransactItems.length) {
      await client.transactWriteItems({ TransactItems }).promise();
    }

    return true;
  },

  async exists(...keys) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));

    assert(Array.isArray(keys) && keys.length, new TypeError('Expected an array of keys'));
    assert(keys.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));
    keys.forEach(key => assert(typeof key === 'string' && key.length, new TypeError('Expected each key to be a string')));

    const TransactItems = keys.map(key => ({
      Get: {
        TableName: tableName,
        Key: marshall({ key }),
        ProjectionExpression: '#key',
        ExpressionAttributeNames: { '#key': 'key' },
      },
    }));

    if (TransactItems.length) {
      const res = await client.transactGetItems({ TransactItems }).promise();
      assert(res && Array.isArray(res.Responses), new TypeError('Expected transactGetItems results to be an array'));
      return res.Responses.reduce((r, { Item }) => r + (Item && Item.key ? 1 : 0), 0);
    } else {
      return 0;
    }
  },

  async flushdb() {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));

    const params = {
      TableName: tableName,
      ProjectionExpression: '#key',
      ExpressionAttributeNames: { '#key': 'key' },
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

  async move(key, db) {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
    assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));

    assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
    assert(typeof db === 'string' && db.length, new TypeError('Expected db to be a string'));

    const result = await client.getItem({
      TableName: tableName,
      Key: marshall({ key }),
      ConsistentRead: true,
    });

    if (result && result.Item && result.Item.value) {
      try {
        const TransactItems = [
          {
            Delete: {
              TableName: tableName,
              Item: marshall({ key }),
            },
          },
          {
            Put: {
              TableName: db,
              Item: { key: { S: key }, value: result.Item.value },
              ConditionExpression: 'attribute_not_exists(#key)',
              ExpressionAttributeNames: { '#key': 'key' },
            },
          }
        ];

        await client.transactWriteItems({ TransactItems }).promise();
        return true;
      } catch (err) {
        if (err.code !== 'ConditionalCheckFailedException') {
          throw err;
        }
      }
    }

    return false;
  },

};

module.exports = { methods, transactables };
