const assert = require('assert');
const redyn = require('redyn');
const { dynamodb, assertItem, deleteThenCreateExampleTable, marshall, writeItem } = require('@test/utils');
const { v4: uuid } = require('uuid');

describe('commands', () => describe('sets', () => {
  let client = null;
  const TableName = 'redyn-example-table';

  before(async () => {
    await deleteThenCreateExampleTable(dynamodb);
    client = redyn.createClient(TableName);
  });

  it('should use sadd to add to a set', async () => {
    const key = uuid();

    const saddOk1 = await client.sadd(key, 'value');
    assert(saddOk1 === true, 'Expected SADD to return true');
    const saddOk2 = await client.sadd(key, 'value');
    assert(saddOk2 === true, 'Expected SADD to return true');
    const saddOk3 = await client.sadd(key, 'value2');
    assert(saddOk3 === true, 'Expected SADD to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { SS: [ 'value', 'value2' ] },
    });
  });

  it('should use smembers to read from a set', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });

    const values = await client.smembers(key);
    assert.deepStrictEqual(values, [ 'value', 'value2', 'value3' ], 'Expected SMEMBERS to return the whole set');
  });

  it('should use scard to count the items in a set', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });

    const size = await client.scard(key);
    assert.strictEqual(size, 3, 'Expected SCARD to count the whole set');
  });

  it('should use sdiff to diff two sets', async () => {
    const key = uuid();
    const key2 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        value: { SS: [ 'value2', 'value3', 'value4' ] },
      },
    });

    const diff = await client.sdiff(key, key2);
    assert.deepStrictEqual(diff, [ 'value' ]);
  });

  it('should use sdiffstore to diff two sets & store the result', async () => {
    const key = uuid();
    const key2 = uuid();
    const key3 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key3 },
        value: { SS: [ 'value2', 'value3', 'value4' ] },
      },
    });

    const size = await client.sdiffstore(key, key2, key3);
    assert.deepStrictEqual(size, 1, 'Expected SDIFFSTORE to return 1');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { SS: [ 'value' ] },
    });
  });

  it('should use sismember to check if a member is in a set', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });

    const isIn = await client.sismember(key, 'value');
    assert.strictEqual(isIn, true, 'Expected SISMEMBER to return true');
  });

  it('should use sinter to diff two sets', async () => {
    const key = uuid();
    const key2 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value3', 'value5' ] },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        value: { SS: [ 'value', 'value2', 'value4' ] },
      },
    });

    const inter = await client.sinter(key, key2);
    assert.deepStrictEqual(inter, [ 'value' ]);
  });

  it('should use sinterstore to diff two sets & store the result', async () => {
    const key = uuid();
    const key2 = uuid();
    const key3 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        value: { SS: [ 'value', 'value3', 'value5' ] },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key3 },
        value: { SS: [ 'value', 'value2', 'value4' ] },
      },
    });

    const size = await client.sinterstore(key, key2, key3);
    assert.deepStrictEqual(size, 1, 'Expected SINTERSTORE to return 1');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { SS: [ 'value' ] },
    });
  });

  it('should use smismember to check if a member is in a set', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });

    const isIn = await client.smismember(key, 'value', 'value2', 'value4');
    assert.deepStrictEqual(isIn, [ true, true, false ], 'Expected SMISMEMBER to return an array');
  });

  it('should use smove to move a member between sets', async () => {
    const key = uuid();
    const key2 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        value: { SS: [ 'value2', 'value3', 'value4' ] },
      },
    });

    const moved = await client.smove(key, key2, 'value');
    assert.strictEqual(moved, true, 'Expected SMOVE to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { SS: [ 'value2', 'value3' ] },
    });
    await assertItem(dynamodb, { TableName, Key: marshall({ key: key2 }) }, {
      key: { S: key2 },
      value: { SS: [ 'value', 'value2', 'value3', 'value4' ] },
    });
  });

  it('should use srem to remove a member from a set', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });

    const removed = await client.srem(key, 'value');
    assert.strictEqual(removed, true, 'Expected SREM to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { SS: [ 'value2', 'value3' ] },
    });
  });

  it('should use srem to remove members from a set', async () => {
    const key = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value2', 'value3' ] },
      },
    });

    const removed = await client.srem(key, 'value', 'value2', 'value4');
    assert.strictEqual(removed, true, 'Expected SREM to return true');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { SS: [ 'value3' ] },
    });
  });

  it('should use sunion to diff two sets', async () => {
    const key = uuid();
    const key2 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key },
        value: { SS: [ 'value', 'value3' ] },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        value: { SS: [ 'value', 'value2' ] },
      },
    });

    const union = await client.sunion(key, key2);
    assert.deepStrictEqual(union, [ 'value', 'value3', 'value2' ]);
  });

  it('should use sunionstore to diff two sets & store the result', async () => {
    const key = uuid();
    const key2 = uuid();
    const key3 = uuid();

    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key2 },
        value: { SS: [ 'value', 'value3', 'value5' ] },
      },
    });
    await writeItem(dynamodb, {
      TableName,
      Item: {
        key: { S: key3 },
        value: { SS: [ 'value', 'value2', 'value4' ] },
      },
    });

    const size = await client.sunionstore(key, key2, key3);
    assert.deepStrictEqual(size, 5, 'Expected SUNIONSTORE to return 1');

    await assertItem(dynamodb, { TableName, Key: marshall({ key }) }, {
      key: { S: key },
      value: { SS: [ 'value', 'value2', 'value3', 'value4', 'value5' ] },
    });
  });

}));
