const { TransactGetItemsCommand, TransactWriteItemsCommand } = require('@aws-sdk/client-dynamodb');

const { assert, isDynamoDB, isPlainObject } = require('./utils');

class RedynTransactionBlock {
  constructor(name, command, args) {
    assert(typeof name === 'string' && name.length, new TypeError('Expected name to be a string'));
    assert(typeof command === 'string' && command.length, new TypeError('Expected command to be a string'));
    assert(Array.isArray(args), new TypeError('Expected args to be an array'));

    Object.defineProperties(this, {
      name: { enumerable: true, value: name },
      command: { enumerable: true, value: command },
      args: { enumerable: true, value: args },
    });
  }
}

async function runTransaction(client, blocks, opts) {
  assert(isDynamoDB(client), new TypeError('Expected client to be a DynamoDB instance'));
  assert(Array.isArray(blocks), new TypeError('Expected transaction blocks to be an array'));
  assert(blocks.length <= 25, new Error('Expected transaction blocks to contain less than or equal to 25 items'));
  assert(opts === undefined || isPlainObject(opts), new TypeError('Expected opts argument to be a plain object'));

  blocks.forEach(block => assert(block instanceof RedynTransactionBlock,
    new TypeError('Expected each transaction block to be from a client')));

  const promises = [];
  const results = Promise.all(blocks.map(({ name, command, args }, i) => {
    const handler = req => new Promise((resolve, reject) => promises[i] = { req, resolve, reject });
    handler.command = name;
    handler.isTransaction = true;
    return command(handler, ...args);
  }));

  while (promises.filter(p => p && p.i).length < blocks.length) { /* eslint-disable-line no-empty */ }

  promises.forEach(({ req }) => {
    assert(isPlainObject(req), new TypeError('Expected DynamoDB block to be a plain object'));
    assert(Object.keys(req).length === 1, new TypeError('Expected each DynamoDB block to have a single key'));
  });

  const countGetTransacts = promises.filter(({ req }) => req.hasOwnProperty('Get')).length;
  assert(countGetTransacts === 0 || countGetTransacts === promises.length,
    new Error('Only all-GET or no-GET statements in a transaction'));

  if (countGetTransacts > 0) {
    try {
      // Get items in a transaction
      const res = await client.send(new TransactGetItemsCommand({ TransactItems: promises.map(({ req }) => req) }));
      assert(res && Array.isArray(res.Responses), new TypeError('Expected transactGetItems results to be an array'));
      res.Responses.forEach((result, i) => promises[i].resolve(result));
    } catch (err) /* istanbul ignore next */ {
      // console.error(JSON.stringify({ transactWriteItems: TransactItems, err: { ...err } }, null, 2));
      err.message = `TransactionError: ${err.message}`;
      throw err;
    }
  } else {
    try {
      // Write items in a transaction
      await client.send(new TransactWriteItemsCommand({ TransactItems: promises.map(({ req }) => req) }));
      promises.forEach(({ resolve }) => resolve());
    } catch (err) /* istanbul ignore next */ {
      // console.error(JSON.stringify({ transactWriteItems: TransactItems, err: { ...err } }, null, 2));
      err.message = `TransactionError: ${err.message}`;
      throw err;
    }
  }

  await results;
  return results;
}

module.exports = {
  RedynTransactionBlock,
  runTransaction,
};
