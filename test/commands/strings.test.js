const assert = require('assert');
const AWS = require('aws-sdk');
const redyn = require('redyn');
const { dynamodb, deleteThenCreateExampleTable, writeItem } = require('../utils');
const { v4: uuid } = require('uuid');

const { marshall } = AWS.DynamoDB.Converter;

describe('examples', () => describe('strings', () => {
  let client = null;
  const index = 0;
  const TableName = 'redyn-example-table';

  before(async () => {
    const key = uuid();
    await deleteThenCreateExampleTable(dynamodb);
    client = redyn.createClient(TableName);

    await writeItem(dynamodb, { Item: marshall({ key, index, value: 'Hello, world!' }) });
    assert(await client.get(key) === 'Hello, world!', 'Expected GET to return the string');
  });

  it('should set strings', async () => {
    const setOk = await client.set('example-string', 'example-value');
    assert(setOk === true, 'Expected SET to return true');

    const setValue = await client.get('example-string');
    assert(setValue === 'example-value', 'Expected SET to result in "example-value"');
  });

  it('should set numbers', async () => {
    const setOk = await client.set('example-number', 1);
    assert(setOk === true, 'Expected SET to return true');

    const setValue = await client.get('example-number');
    assert(setValue === 1, 'Expected SET to result in 1');
  });

  it('should incr/decr numbers', async () => {
    const setOk = await client.set('example-number', 1);
    assert(setOk === true, 'Expected SET to return true');

    const setValue = await client.get('example-number');
    assert(setValue === 1, 'Expected SET to result in 1');

    const incrOk = await client.incr('example-number');
    assert(incrOk === true, 'Expected INCR to return true');

    const incrValue = await client.get('example-number');
    assert(incrValue === 2, 'Expected INCR to result in 2');

    const incrByOk = await client.incrby('example-number', 3);
    assert(incrByOk === true, 'Expected INCRBY to return true');

    const incrValue2 = await client.get('example-number');
    assert(incrValue2 === 5, 'Expected INCRBY to result in 5');
  });

  it('should mget/mset strings', async () => {
    const setOneOk = await client.mset('example-string', 'example-value');
    assert(setOneOk === true, 'Expected MSET to return true');

    const setOneValue = await client.mget('example-string');
    assert.deepStrictEqual(setOneValue, [ 'example-value' ], 'Expected MSET to result in ["example-value"]');

    const setTwoOk = await client.mset('example-string-1', 'example-value-1', 'example-string-2', 'example-value-2');
    assert(setTwoOk === true, 'Expected MSET to return true');

    const setTwoValue = await client.mget('example-string', 'example-string-1', 'example-string-2');
    assert.deepStrictEqual(setTwoValue, [ 'example-value', 'example-value-1', 'example-value-2' ],
      'Expected MSET to result in ["example-value","example-value-1","example-value-2"]');

    const setManyOk = await client.mset({
      'example-string': 'example-value',
      'example-string-42': 'example-value-42',
      'example-string-256': 'example-value-256',
      'example-string-1024': 'example-value-1024',
    });
    assert(setManyOk === true, 'Expected MSET to return true');

    const setManyValue = await client.mget('example-string', 'example-string-42', 'example-string-256', 'example-string-1024');
    assert.deepStrictEqual(setManyValue, [ 'example-value', 'example-value-42', 'example-value-256', 'example-value-1024' ],
      'Expected MSET to result in ["example-value","example-value-42","example-value-256","example-string-1024"]');
  });

  it('should strlen strings', async () => {
    const setOk = await client.set('example-string', 'example-value');
    assert(setOk === true, 'Expected SET to return true');

    const length = await client.strlen('example-string');
    assert(length === 13, 'Expected STRLEN to return 13');
  });

}));
