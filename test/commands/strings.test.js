const assert = require('assert');
const redyn = require('redyn');
const { dynamodb, assertItem, deleteThenCreateExampleTable, marshall, writeItem } = require('../utils');
const { v4: uuid } = require('uuid');

describe('commands', () => describe('strings', () => {
  let client = null;
  const index = 0;
  const TableName = 'redyn-example-table';

  before(async () => {
    await deleteThenCreateExampleTable(dynamodb);
    client = redyn.createClient(TableName);
  });

  it('should get strings', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        index: { N: `${index}` },
        value: { S: 'example-value' },
      },
    });

    const result = await client.get(key);
    assert.strictEqual(result, 'example-value', 'Expected GET to return the string value');
  });

  it('should set strings', async () => {
    const key = uuid();

    const result = await client.set(key, 'example-value');
    assert(result === true, 'Expected SET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { S: 'example-value' },
    });
  });

  it('should get numbers', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        index: { N: `${index}` },
        value: { N: '1.23' },
      },
    });

    const result = await client.get(key);
    assert.strictEqual(result, 1.23, 'Expected GET to return the number value');
  });

  it('should set numbers', async () => {
    const key = uuid();

    const result = await client.set(key, 1);
    assert(result === true, 'Expected SET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { N: '1' },
    });
  });

  it('should incr numbers', async () => {
    const key = uuid();

    const result = await client.incr(key);
    assert(result === true, 'Expected INCR to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { N: '1' },
    });
  });

  it('should incrby numbers', async () => {
    const key = uuid();

    const result = await client.incrby(key, 5);
    assert(result === true, 'Expected INCRBY to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { N: '5' },
    });
  });

  it('should decr numbers', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        index: { N: `${index}` },
        value: { N: '5' },
      },
    });

    const result = await client.decr(key);
    assert(result === true, 'Expected DECR to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { N: '4' },
    });
  });

  it('should decrby numbers', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        index: { N: `${index}` },
        value: { N: '10' },
      },
    });

    const result = await client.decrby(key, 5);
    assert(result === true, 'Expected DECRBY to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { N: '5' },
    });
  });

  it('should mget a string', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        index: { N: `${index}` },
        value: { S: 'example-value' },
      },
    });

    const result = await client.mget(key);
    assert.deepStrictEqual(result, [ 'example-value' ]);
  });

  it('should mget some strings', async () => {
    const key = uuid();
    const key2 = uuid();
    const key3 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        index: { N: `${index}` },
        value: { S: 'example-value' },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        index: { N: `${index}` },
        value: { S: 'example-value2' },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key3 },
        index: { N: `${index}` },
        value: { S: 'example-value3' },
      },
    });

    const result = await client.mget(key, key2, key3);
    assert.deepStrictEqual(result, [ 'example-value', 'example-value2', 'example-value3' ]);
  });

  it('should mset a string', async () => {
    const key = uuid();

    const result = await client.mset(key, 'example-value');
    assert.deepStrictEqual(result, true, 'Expected MSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { S: 'example-value' },
    });
  });

  it('should mset some strings', async () => {
    const key = uuid();
    const key2 = uuid();
    const key3 = uuid();

    const result = await client.mset(key, 'example-value', key2, 'example-value2', key3, 'example-value3');
    assert.deepStrictEqual(result, true, 'Expected MSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { S: 'example-value' },
    });
    await assertItem(dynamodb, { TableName, Key: marshall({ key: key2, index }) }, {
      key: { S: key2 },
      index: { N: `${index}` },
      value: { S: 'example-value2' },
    });
    await assertItem(dynamodb, { TableName, Key: marshall({ key: key3, index }) }, {
      key: { S: key3 },
      index: { N: `${index}` },
      value: { S: 'example-value3' },
    });
  });

  it('should mset an object', async () => {
    const key = uuid();
    const key2 = uuid();
    const key3 = uuid();

    const result = await client.mset({
      [key]: 'example-value',
      [key2]: 'example-value2',
      [key3]: 'example-value3',
    });
    assert.deepStrictEqual(result, true, 'Expected MSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key, index }) }, {
      key: { S: key },
      index: { N: `${index}` },
      value: { S: 'example-value' },
    });
    await assertItem(dynamodb, { TableName, Key: marshall({ key: key2, index }) }, {
      key: { S: key2 },
      index: { N: `${index}` },
      value: { S: 'example-value2' },
    });
    await assertItem(dynamodb, { TableName, Key: marshall({ key: key3, index }) }, {
      key: { S: key3 },
      index: { N: `${index}` },
      value: { S: 'example-value3' },
    });
  });

  it('should strlen strings', async () => {
    const setOk = await client.set('example-string', 'example-value');
    assert(setOk === true, 'Expected SET to return true');

    const length = await client.strlen('example-string');
    assert(length === 13, 'Expected STRLEN to return 13');
  });

}));
