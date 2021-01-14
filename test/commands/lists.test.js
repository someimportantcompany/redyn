const assert = require('assert');
const AWS = require('aws-sdk');
const redyn = require('redyn');
const { dynamodb, deleteThenCreateExampleTable, writeItem } = require('../utils');
const { v4: uuid } = require('uuid');

const { marshall } = AWS.DynamoDB.Converter;

describe('examples', () => describe('lists', () => {
  let client = null;
  const index = 0;
  const TableName = 'redyn-example-table';

  before(async () => {
    const key = uuid();
    await deleteThenCreateExampleTable(dynamodb);
    client = redyn.createClient(TableName);

    await writeItem(dynamodb, { Item: marshall({ key, index, value: [ 'Hello', 'world' ] }) });
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

}));
