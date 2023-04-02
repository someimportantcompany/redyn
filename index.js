const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const { assert, createLogger, isPlainObject } = require('./utils');
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
    client: { value: validateDynamoDB(opts.dynamodb) || overwriteDynamoDB || new DynamoDBClient({}) },
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
  if (client instanceof DynamoDBClient) {
    return client
  } else if (isPlainObject(client)) {
    return new DynamoDBClient({ ...client });
  } else {
    return null;
  }
}

module.exports = {
  createClient,

  /**
   * @param {(DynamoDBClient|Object)}
   * @return {(DynamoDBClient|null)}
   */
  setDynamoDB(client) {
    overwriteDynamoDB = validateDynamoDB(client);
    return overwriteDynamoDB;
  },

  /**
   * Run a transaction
   *
   * @param {(DynamoDBClient|Object)} [client] Defaults to the global or a clean DynamoDB instance
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

    return runTransaction(validateDynamoDB(client) || overwriteDynamoDB || new DynamoDBClient(), blocks, opts);
  },
};
