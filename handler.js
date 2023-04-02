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

        const { Get, Put, Update, Delete } = body;
        let result = null;

        if (Get) {
          // console.log(JSON.stringify({ getItem: Get }, null, 2));
          result = await client.send(new GetItemCommand(Get));
          // console.log(JSON.stringify({ getItem: result }, null, 2));
        } else if (Put) {
          // console.log(JSON.stringify({ putItem: Put }, null, 2));
          result = await client.send(new PutItemCommand(Put));
          // console.log(JSON.stringify({ putItem: result }, null, 2));
        } else if (Update) {
          // console.log(JSON.stringify({ updateItem: Update }, null, 2));
          result = await client.send(new UpdateItemCommand(Update));
          // console.log(JSON.stringify({ updateItem: result }, null, 2));
        } else if (Delete) {
          // console.log(JSON.stringify({ deleteItem: Delete }, null, 2));
          result = await client.send(new DeleteItemCommand(Delete));
          // console.log(JSON.stringify({ deleteItem: result }, null, 2));
        } else {
          const [ key ] = Object.keys(body);
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
