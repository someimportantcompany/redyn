const assert = require('assert');
const redyn = require('redyn');
const { dynamodb, assertItem, deleteThenCreateExampleTable, marshall, writeItem } = require('@test/utils');
const { v4: uuid } = require('uuid');

describe('commands', () => describe('lists', () => {
  let client = null;
  const TableName = 'redyn-example-table';

  before(async () => {
    await deleteThenCreateExampleTable(dynamodb);
    client = redyn.createClient(TableName);
  });

  it('should rpush onto a list', async () => {
    const key = uuid();

    const rpushOk1 = await client.rpush(key, 'value');
    assert.strictEqual(rpushOk1, 1, 'Expected RPUSH to return length 1');

    const rpushOk2 = await client.rpush(key, 'value2', 'value3');
    assert.strictEqual(rpushOk2, 3, 'Expected RPUSH to return length 3');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { L: [ { S: 'value' }, { S: 'value2' }, { S: 'value3' } ] },
    });
  });

  it('should lpush onto a list', async () => {
    const key = uuid();

    const lpushOk1 = await client.lpush(key, 'value');
    assert.strictEqual(lpushOk1, 1, 'Expected LPUSH to return length 1');

    const lpushOk2 = await client.lpush(key, 'value2', 'value3');
    assert.strictEqual(lpushOk2, 3, 'Expected LPUSH to return length 3');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { L: [ { S: 'value3' }, { S: 'value2' }, { S: 'value' } ] },
    });
  });

  it('should rpushx a list', async () => {
    const key = uuid();

    const rpushOk = await client.rpush(key, 'value');
    assert.strictEqual(rpushOk, 1, 'Expected RPUSH to return length 1');

    const rpushxOk = await client.rpushx(key, 'value2');
    assert.strictEqual(rpushxOk, 2, 'Expected RPUSHX to return length 2');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { L: [ { S: 'value' }, { S: 'value2' } ] },
    });
  });

  it('should lpushx a list', async () => {
    const key = uuid();

    const rpushOk = await client.rpush(key, 'value');
    assert.strictEqual(rpushOk, 1, 'Expected RPUSH to return length 1');

    const lpushxOk = await client.lpushx(key, 'value2');
    assert.strictEqual(lpushxOk, 2, 'Expected LPUSHX to return length 2');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { L: [ { S: 'value2' }, { S: 'value' } ] },
    });
  });

  it('should fail to rpushx a list silently', async () => {
    const key = uuid();

    const rpushOk = await client.rpushx(key, 'value');
    assert(rpushOk === false, 'Expected RPUSHX to return false when the list does not exist');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, null);
  });

  it('should fail to lpushx a list silently', async () => {
    const key = uuid();

    const lpushOk = await client.lpushx(key, 'value');
    assert(lpushOk === false, 'Expected LPUSHX to return false when the list does not exist');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, null);
  });

  it('should use lrange to read from a list', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { L: [ { S: 'value' }, { S: 'value2' }, { S: 'value3' } ] },
      },
    });

    const values = await client.lrange(key, 0, -1);
    assert.deepStrictEqual(values, [ 'value', 'value2', 'value3' ], 'Expected LRANGE to return the whole list');
  });

  it('should lrange the start of a list', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { L: [ { S: 'value' }, { S: 'value2' }, { S: 'value3' }, { S: 'value4' }, { S: 'value5' } ] },
      },
    });

    const lrangeValue = await client.lrange(key, 0, 2);
    assert.deepStrictEqual(lrangeValue, [ 'value', 'value2', 'value3' ], 'Expected LRANGE to return an array');
  });

  it('should lrange the end of a list', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { L: [ { S: 'value' }, { S: 'value2' }, { S: 'value3' }, { S: 'value4' }, { S: 'value5' } ] },
      },
    });

    const lrangeValue = await client.lrange(key, -2, -1);
    assert.deepStrictEqual(lrangeValue, [ 'value4', 'value5' ], 'Expected LRANGE to return an array');
  });

  it('should lset a specific index in the list', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { L: [ { S: 'value' }, { S: 'value2' }, { S: 'value3' }, { S: 'value4' }, { S: 'value5' } ] },
      },
    });

    const result = await client.lset(key, 1, 'overwrite');
    assert(result === true, 'Expected LSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { L: [ { S: 'value' }, { S: 'overwrite' }, { S: 'value3' }, { S: 'value4' }, { S: 'value5' } ] },
    });
  });

  it('should use lindex to return a specific item at an index', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { L: [ { S: 'value' }, { S: 'value2' }, { S: 'value3' }, { S: 'value4' }, { S: 'value5' } ] },
      },
    });

    const result = await client.lindex(key, 1);
    assert.strictEqual(result, 'value2', 'Expected LINDEX to return value2');
  });

  it('should use llen to return the length of the list', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { L: [ { S: 'value' }, { S: 'value2' }, { S: 'value3' }, { S: 'value4' }, { S: 'value5' } ] },
      },
    });

    const result = await client.llen(key);
    assert.strictEqual(result, 5, 'Expected LLEN to return 5');
  });

}));
