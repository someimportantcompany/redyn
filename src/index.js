const AWS = require('aws-sdk');
const { assert, createLogger, isPlainObject, packageName } = require('./utils');
const { commands, standalone } = require('./commands');
const { createMethod } = require('./handlers');

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
    ...Object.keys(commands).reduce((cs, key) => {
      cs[`${key}`.toLowerCase()] = cs[`${key}`.toUpperCase()] = createMethod(`${key}`.toUpperCase(), commands[key]);
      return cs;
    }, {}),
    ...Object.keys(standalone).reduce((cs, key) => {
      cs[`${key}`.toLowerCase()] = cs[`${key}`.toUpperCase()] = standalone[key];
      return cs;
    }, {}),
  }, {
    tableName: { enumerable: true, value: tableName },
    client: { value: validateDynamoDB(opts.dynamodb) || overwriteDynamoDB || new AWS.DynamoDB() },
    log: { value: opts.log || createLogger(), },
  });
}

function validateDynamoDB(client) {
  if (isPlainObject(client)) {
    return new AWS.DynamoDB({ ...client });
  } else if (client) {
    assert(!(client instanceof AWS.DynamoDB.DocumentClient),
      new TypeError(`Sorry, ${packageName} doesn't support AWS.DynamoDB.DocumentClient`));
    assert(client instanceof AWS.DynamoDB,
      new TypeError('Expected { dynamodb } to be an instance of AWS.DynamoDB'));
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
};
