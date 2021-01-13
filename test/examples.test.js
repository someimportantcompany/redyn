const assert = require('assert');
const AWS = require('aws-sdk');
const redyn = require('redyn');
const { dynamodb, deleteThenCreateExampleTable, writeItem } = require('./utils');
const { v4: uuid } = require('uuid');

const { marshall } = AWS.DynamoDB.Converter;

describe('examples', () => {
  let client = null;
  const TableName = 'redyn-example-table';

  before(async () => {
    await deleteThenCreateExampleTable(dynamodb);
    client = redyn.createClient(TableName);
  });

  describe('strings', () => {
    before(async () => {
      await writeItem(dynamodb, { Item: marshall({ key: 'example-get', index: 0, value: 'Hello, world!' }) });

      const getValue = await client.get('example-get');
      assert(getValue === 'Hello, world!', 'Expected GET to return the string');
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
  });

  describe('lists', () => {
    before(async () => {
      const key = uuid();
      await writeItem(dynamodb, { Item: marshall({ key, index: 0, value: [ 'Hello', 'world' ] }) });

      const listValue = await client.lrange(key, 0, -1);
      assert.deepStrictEqual(listValue, [ 'Hello', 'world' ], 'Expected LRANGE 0 -1 to return the whole array');
    });

    it('should rpush onto a list', async () => {
      const key = uuid();

      const rpushOk1 = await client.rpush(key, 'value');
      assert(rpushOk1 === true, 'Expected RPUSH to return true');

      const rpushOk2 = await client.rpush(key, 'value2', 'value3');
      assert(rpushOk2 === true, 'Expected RPUSH to return true');

      assert.deepStrictEqual(await client.lrange(key, 0, -1), [ 'value', 'value2', 'value3' ],
        'Expected LRANGE 0 -1 to return the whole array');
    });

    it('should lpush onto a list', async () => {
      const key = uuid();

      const lpushOk1 = await client.lpush(key, 'value');
      assert(lpushOk1 === true, 'Expected LPUSH to return true');

      const lpushOk2 = await client.lpush(key, 'value2', 'value3');
      assert(lpushOk2 === true, 'Expected LPUSH to return true');

      assert.deepStrictEqual(await client.lrange(key, 0, -1), [ 'value3', 'value2', 'value' ],
        'Expected LRANGE 0 -1 to return the whole array');
    });

    it('should lrange the start of a list', async () => {
      const key = uuid();

      const rpushOk = await client.rpush(key, 'value', 'value2', 'value3', 'value4', 'value5');
      assert(rpushOk === true, 'Expected RPUSH to return true');

      const lrangeValue = await client.lrange(key, 0, 2);
      assert.deepStrictEqual(lrangeValue, [ 'value', 'value2', 'value3' ], 'Expected LRANGE to return an array');
    });

    it('should lrange the end of a list', async () => {
      const key = uuid();

      const rpushOk = await client.rpush(key, 'value', 'value2', 'value3', 'value4', 'value5');
      assert(rpushOk === true, 'Expected RPUSH to return true');

      const lrangeValue = await client.lrange(key, -2, -1);
      assert.deepStrictEqual(lrangeValue, [ 'value4', 'value5' ], 'Expected LRANGE to return an array');
    });

    it('should rpushx a list', async () => {
      const key = uuid();

      const rpushOk = await client.rpush(key, 'value');
      assert(rpushOk === true, 'Expected RPUSH to return true');

      const rpushxOk = await client.rpushx(key, 'value1');
      assert(rpushxOk === true, 'Expected RPUSHX to return true');

      assert.deepStrictEqual(await client.lrange(key, 0, -1), [ 'value', 'value1' ],
        'Expected LRANGE to return an array');
    });

    it('should lpushx a list', async () => {
      const key = uuid();

      const rpushOk = await client.rpush(key, 'value');
      assert(rpushOk === true, 'Expected RPUSH to return true');

      const lpushxOk = await client.lpushx(key, 'value1');
      assert(lpushxOk === true, 'Expected LPUSHX to return true');

      assert.deepStrictEqual(await client.lrange(key, 0, -1), [ 'value1', 'value' ],
        'Expected LRANGE to return an array');
    });

    it('should fail to rpushx a list silently', async () => {
      const key = uuid();

      const rpushOk = await client.rpushx(key, 'value');
      assert(rpushOk === true, 'Expected RPUSH to return true');

      assert.deepStrictEqual(await client.lrange(key, 0, -1), [],
        'Expected LRANGE to return an array');
    });

    it('should fail to lpushx a list silently', async () => {
      const key = uuid();

      const rpushOk = await client.lpushx(key, 'value');
      assert(rpushOk === true, 'Expected RPUSH to return true');

      assert.deepStrictEqual(await client.lrange(key, 0, -1), [],
        'Expected LRANGE to return an array');
    });
  });

});
