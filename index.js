const AWS = require('aws-sdk');
const { assert, createLogger, isDynamoDB, isPlainObject } = require('./utils');
const { createStandaloneHandler, createTransactionHandler } = require('./handler');
const { methods, transactables } = require('./commands');
const { runTransaction } = require('./transactions');

let overwriteDynamoDB = null;

/**
 * @param {Object} opts
 * @return {Object}
 */
function createClient(opts) {
  opts = (opts && typeof opts === 'string') ? { tableName: opts } : opts;
  assert(isPlainObject(opts), new TypeError('Expected createClient argument to be an object'));

  // Required
  const { tableName } = opts;
  assert(typeof tableName === 'string', new TypeError('Expected { tableName } to be a string'));

  return Object.create({
    ...Object.keys(transactables).reduce((cs, key) => {
      cs[`${key}`.toLowerCase()] = cs[`${key}`.toUpperCase()] =
        createStandaloneHandler(`${key}`.toUpperCase(), transactables[key]);
      return cs;
    }, {}),
    ...Object.keys(methods).reduce((cs, key) => {
      cs[`${key}`.toLowerCase()] = cs[`${key}`.toUpperCase()] = methods[key];
      return cs;
    }, {}),
  }, {
    tableName: { enumerable: true, value: tableName },
    client: { value: validateDynamoDB(opts.dynamodb) || overwriteDynamoDB || new AWS.DynamoDB() },
    log: { value: opts.log || createLogger(), },
    transaction: {
      get() {
        assert(!opts.dynamodb, new Error('Client cannot take part in transactions with specific DynamoDB instances'));

        return Object.keys(transactables).reduce((cs, key) => {
          cs[`${key}`.toLowerCase()] = cs[`${key}`.toUpperCase()] =
            createTransactionHandler.call(this, `${key}`.toUpperCase(), transactables[key]);
          return cs;
        }, {});
      },
    },
  });
}

function validateDynamoDB(client) {
  if (isPlainObject(client)) {
    return new AWS.DynamoDB({ ...client });
  } else if (client) {
    const { DynamoDB: { DocumentClient } } = AWS;
    assert(!(client instanceof DocumentClient), new TypeError('AWS.DynamoDB.DocumentClient is not supported'));
    assert(isDynamoDB(client), new TypeError('Expected { dynamodb } to be an instance of AWS.DynamoDB'));
    return client;
  } else {
    return null;
  }
}

module.exports = {
  createClient,

  /**
   * @param {(AWS.DynamoDB|Object)}
   * @return {(AWS.DynamoDB|null)}
   */
  setDynamoDB(client) {
    overwriteDynamoDB = validateDynamoDB(client);
    return overwriteDynamoDB;
  },

  /**
   * Run a transaction
   *
   * @param {(AWS.DynamoDB|Object)} [client] Defaults to the global or a clean DynamoDB instance
   * @param {RedynTransactionBlock[]} blocks The array
   * @param {(Object|undefined)} [opts]
   * @return {(Object|null)[]}
   */
  transaction(client, blocks, opts = undefined) {
    if (Array.isArray(client)) {
      // client => blocks
      opts = blocks;
      blocks = client;
      client = null;
    }

    return runTransaction(validateDynamoDB(client) || overwriteDynamoDB || new AWS.DynamoDB(), blocks, opts);
  },
};
