const { assert, isDynamoDB } = require('../utils');

const transactables = {
  // COPY
  // DEL
  // EXPIRE
  // EXPIREAT
  // PERSIST
  // TOUCH?
  // TTL
  // TYPE
};

const methods = {

  // EXISTS
  // KEYS
  // MOVE
  // RENAME
  // RENAMENX
  // SCAN

  async flushall() {
    const { client, tableName } = this;
    assert(isDynamoDB(client), new TypeError('Expected client to be an instance of AWS.DynamoDB'));
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

module.exports = { methods, transactables };
