const assert = require('assert');
const {
  DynamoDBClient,
  PutItemCommand, CreateTableCommand, DeleteTableCommand, UpdateTimeToLiveCommand,
} = require('@aws-sdk/client-dynamodb');

const exampleTable = require('../createTable.json');
const { isPlainObject, marshall } = require('../utils');

async function assertItem(dynamodb, getItemOpts, expected) {
  assert(dynamodb instanceof DynamoDBClient, 'Expected assertItem dynamodb to be an instance of DynamoDBClient');
  assert(isPlainObject(getItemOpts), 'Expected assertItem getItemOpts to be a plain object');

  getItemOpts.TableName = typeof getItemOpts.TableName === 'string' ? getItemOpts.TableName : 'redyn-example-table';
  getItemOpts.ConsistentRead = typeof getItemOpts.ConsistentRead === 'boolean' ? getItemOpts.ConsistentRead : true;

  const result = await dynamodb.getItem(getItemOpts).promise();
  const actual = isPlainObject(result.Item) ? result.Item : null;
  assert.deepStrictEqual(actual, expected, 'Expected item in DynamoDB to deepStrictEqual');
}

async function deleteThenCreateTable(dynamodb, opts) {
  assert(dynamodb instanceof DynamoDBClient, 'Expected deleteThenCreateTable dynamodb to be an instance of DynamoDBClient');
  assert(isPlainObject(opts), 'Expected deleteThenCreateTable opts to be a plain object');

  const { TableName, TimeToLiveSpecification, ...createTableParams } = opts;
  assert(TableName && typeof TableName === 'string', 'Expected deleteThenCreateTable opts.TableName to be a string');

  try {
    // console.log(JSON.stringify({ deleteTable: { TableName } }, null, 2));
    await dynamodb.send(new DeleteTableCommand({ TableName }));
  } catch (err) {
    if (!`${err.message}`.includes('Cannot do operations on a non-existent table')) {
      err.message = `Failed to delete ${TableName}: ${err.message}`;
      throw err;
    }
  }

  try {
    // console.log(JSON.stringify({ createTable: { TableName, ...createTableParams } }, null, 2));
    await dynamodb.send(new CreateTableCommand({ TableName, ...createTableParams }));
  } catch (err) {
    err.message = `Failed to create ${TableName}: ${err.message}`;
    throw err;
  }

  if (TimeToLiveSpecification) {
    try {
      // console.log(JSON.stringify({ updateTimeToLive: { TableName, TimeToLiveSpecification } }, null, 2));
      await dynamodb.send(new UpdateTimeToLiveCommand({ TableName, TimeToLiveSpecification }));
    } catch (err) {
      err.message = `Failed to set TTL for ${TableName}: ${err.message}`;
      throw err;
    }
  }
}

async function writeItem(dynamodb, putItemOpts) {
  assert(dynamodb instanceof DynamoDBClient, 'Expected writeItem dynamodb to be an instance of DynamoDBClient');
  assert(isPlainObject(putItemOpts), 'Expected writeItem putItemOpts to be a plain object');

  putItemOpts.TableName = typeof putItemOpts.TableName === 'string' ? putItemOpts.TableName : 'redyn-example-table';
  assert(isPlainObject(putItemOpts.Item), 'Expected writeItem putItemOpts.Item to be a plain object');

  await dynamodb.send(new PutItemCommand(putItemOpts));
}

module.exports = {
  assertItem,
  dynamodb: new DynamoDBClient({
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
    region: process.env.AWS_REGION || 'us-east-1',
  }),
  deleteThenCreateExampleTable: d => deleteThenCreateTable(d, exampleTable),
  deleteThenCreateTable,
  marshall,
  writeItem,
};
