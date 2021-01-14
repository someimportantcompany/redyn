const _isPlainObject = require('lodash/isPlainObject');
const assert = require('assert');
const AWS = require('aws-sdk');
const exampleTable = require('../createTable.json');
const { marshall } = require('../src/utils');

async function assertItem(dynamodb, getItemOpts, expected) {
  assert(dynamodb instanceof AWS.DynamoDB, 'Expected assertItem dynamodb to be an instance of AWS.DynamoDB');
  assert(_isPlainObject(getItemOpts), 'Expected assertItem getItemOpts to be a plain object');

  getItemOpts.TableName = typeof getItemOpts.TableName === 'string' ? getItemOpts.TableName : 'redyn-example-table';
  getItemOpts.ConsistentRead = typeof getItemOpts.ConsistentRead === 'boolean' ? getItemOpts.ConsistentRead : true;

  const result = await dynamodb.getItem(getItemOpts).promise();
  const actual = _isPlainObject(result.Item) ? result.Item : null;
  assert.deepStrictEqual(actual, expected, 'Expected item in DynamoDB to deepStrictEqual');
}

async function writeItem(dynamodb, putItemOpts) {
  assert(dynamodb instanceof AWS.DynamoDB, 'Expected assertItem dynamodb to be an instance of AWS.DynamoDB');
  assert(_isPlainObject(putItemOpts), 'Expected assertItem putItemOpts to be a plain object');

  putItemOpts.TableName = typeof putItemOpts.TableName === 'string' ? putItemOpts.TableName : 'redyn-example-table';

  await dynamodb.putItem(putItemOpts).promise();
}

async function deleteThenCreateTable(dynamodb, opts) {
  assert(dynamodb instanceof AWS.DynamoDB, 'Expected deleteThenCreateTable dynamodb to be an instance of AWS.DynamoDB');
  assert(_isPlainObject(opts), 'Expected deleteThenCreateTable opts to be a plain object');

  const { TableName, TimeToLiveSpecification, ...createTableParams } = opts;
  assert(TableName && typeof TableName === 'string', 'Expected deleteThenCreateTable opts.TableName to be a string');

  try {
    // console.log(JSON.stringify({ deleteTable: { TableName } }, null, 2));
    await dynamodb.deleteTable({ TableName }).promise();
  } catch (err) {
    if (!`${err.message}`.includes('Cannot do operations on a non-existent table')) {
      err.message = `Failed to delete ${TableName}: ${err.message}`;
      throw err;
    }
  }

  try {
    // console.log(JSON.stringify({ createTable: { TableName, ...createTableParams } }, null, 2));
    await dynamodb.createTable({ TableName, ...createTableParams }).promise();
  } catch (err) {
    err.message = `Failed to create ${TableName}: ${err.message}`;
    throw err;
  }

  if (TimeToLiveSpecification) {
    try {
      // console.log(JSON.stringify({ updateTimeToLive: { TableName, TimeToLiveSpecification } }, null, 2));
      await dynamodb.updateTimeToLive({ TableName, TimeToLiveSpecification }).promise();
    } catch (err) {
      err.message = `Failed to set TTL for ${TableName}: ${err.message}`;
      throw err;
    }
  }
}

module.exports = {
  assertItem,
  dynamodb: new AWS.DynamoDB({
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
    region: process.env.AWS_REGION || 'us-east-1',
  }),
  deleteThenCreateExampleTable: d => deleteThenCreateTable(d, exampleTable),
  deleteThenCreateTable,
  marshall,
  writeItem,
};
