const assert = require('assert');
const redyn = require('redyn');
const { dynamodb, assertItem, deleteThenCreateExampleTable, marshall, writeItem } = require('../utils');
const { v4: uuid } = require('uuid');

describe('commands', () => describe('hashes', () => {
  let client = null;
  const TableName = 'redyn-example-table';

  before(async () => {
    await deleteThenCreateExampleTable(dynamodb);
    client = redyn.createClient(TableName);
  });

  it('should hset a new hashmap', async () => {
    const key = uuid();

    const result = await client.hset(key, 'field', 'value');
    assert(result === true, 'Expected HSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { M: { field: { S: 'value' } } },
    });
  });

  it('should hset a field in an existing hashmap', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { M: { field: { S: 'value' } } },
      },
    });

    const result = await client.hset(key, 'field2', 'value2');
    assert(result === true, 'Expected HSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { M: { field: { S: 'value' }, field2: { S: 'value2' } } },
    });
  });

  it('should hset an object as a new hashmap', async () => {
    const key = uuid();

    const result = await client.hset(key, { field: 'value' });
    assert(result === true, 'Expected HSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { M: { field: { S: 'value' } } },
    });
  });

  it('should hset an object in an existing hashmap', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { M: { field: { S: 'value' } } },
      },
    });

    const result = await client.hset(key, { field2: 'value2' });
    assert(result === true, 'Expected HSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { M: { field: { S: 'value' }, field2: { S: 'value2' } } },
    });
  });

  it('should hget a field from the hashmap', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { M: { field: { S: 'value' } } },
      },
    });

    const result = await client.hget(key, 'field');
    assert.strictEqual(result, 'value', 'Expected HGET to return the value');
  });

  it('should hgetall an object from the hashmap', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { M: { field: { S: 'value' } } },
      },
    });

    const result = await client.hgetall(key);
    assert.deepStrictEqual(result, { field: 'value' }, 'Expected HGETALL to return the value');
  });

  it('should hincrby an value in the hashmap', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { M: { field: { S: 'value' } } },
      },
    });

    const result = await client.hincrby(key, 'field2', 1);
    assert.strictEqual(result, true, 'Expected HINCRBY to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { M: { field: { S: 'value' }, field2: { N: '1' } } },
    });
  });

  it('should hmget multiple fields from the hashmap', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { M: { field: { S: 'value' }, field2: { S: 'value2' } } },
      },
    });

    const result = await client.hmget(key, 'field', 'field2');
    assert.deepStrictEqual(result, [ 'value', 'value2' ], 'Expected HMGET to return the value');
  });

  it('should hset an object as a new hashmap', async () => {
    const key = uuid();

    const result = await client.hset(key, { field: 'value' });
    assert(result === true, 'Expected HMSET to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { M: { field: { S: 'value' } } },
    });
  });

}));
