const { GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');

const { assert, isPlainObject, isDynamoDB, packageName } = require('./utils');
const { RedynTransactionBlock } = require('./transactions');
/* eslint-disable no-invalid-this */

function createStandaloneHandler(name, command) {
  return async function method(...args) {
    try {
      const { client } = this;
      assert(isDynamoDB(client), 'Expected client to be an instance of DynamoDB client');

      const handler = async body => {
        assert(isPlainObject(body), new TypeError('Expected handler body to be an object'));
        assert(Object.keys(body).length === 1, new TypeError('Expected handler body to have one key'));

        const entries = Object.entries(body);
        assert(entries.length === 1, new TypeError('Expected handler body to have one key'));
        const [[key, params]] = entries;

        let result = null;

        if (key === 'Get') {
          // console.log(JSON.stringify({ GetItemCommandInput: params }, null, 2));
          result = await client.send(new GetItemCommand(params));
          // console.log(JSON.stringify({ GetItemCommandOutput: result }, null, 2));
        } else if (key === 'Put') {
          // console.log(JSON.stringify({ PutItemCommandInput: params }, null, 2));
          result = await client.send(new PutItemCommand(params));
          // console.log(JSON.stringify({ PutItemCommandOutput: result }, null, 2));
        } else if (key === 'Update') {
          // console.log(JSON.stringify({ UpdateItemCommandInput: params }, null, 2));
          result = await client.send(new UpdateItemCommand(params));
          // console.log(JSON.stringify({ UpdateItemCommandOutput: result }, null, 2));
        } else if (key === 'Delete') {
          // console.log(JSON.stringify({ DeleteItemCommandInput: params }, null, 2));
          result = await client.send(new DeleteItemCommand(params));
          // console.log(JSON.stringify({ DeleteItemCommandOutput: result }, null, 2));
        } else {
          throw new TypeError(`Unknown key ${key} for non-transact handler`);
        }

        return result;
      };

      handler.command = name;
      handler.isTransaction = false;

      const result = await command.call(this, handler, ...args);
      return result;
    } catch (err) {
      err.message = `[${packageName}][${name}]: ${err.message}`;
      throw err;
    }
  };
}

function createTransactionHandler(name, command) {
  return function transact(...args) {
    return new RedynTransactionBlock(name, command, args);
  };
}

module.exports = {
  createStandaloneHandler,
  createTransactionHandler,
};
