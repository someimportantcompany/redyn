const AWS = require('aws-sdk');
const isPlainObject = require('lodash.isplainobject');
const ms = require('ms');

const { name: packageName } = require('../package.json');
const { marshall, unmarshall } = AWS.DynamoDB.Converter;

const TEN_YEARS_MS = 60 * 60 * 24 * 7 * 52 * 10 * 1000;

function assert(value, err, additional = {}) {
  if (Boolean(value) === false) {
    /* istanbul ignore if */
    if ((err instanceof Error) === false) {
      err = new Error(`${err}`);
      if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(err, assert);
      }
    }

    for (const key in additional) {
      /* istanbul ignore else */
      if (additional.hasOwnProperty(key) && key !== 'message' && key !== 'stack') {
        try {
          err[key] = typeof additional[key] === 'function' ? additional[key].call() : additional[key];
        } catch (e) /* istanbul ignore next */ {
          err[key] = `ERR: ${e.message}`;
        }
      }
    }

    throw err;
  }

  return true;
}

function buildTTL(ttl) {
  assert([ 'string', 'number', 'undefined' ].includes(typeof ttl), new TypeError('Expected ttl to be a string/number'));
  if (ttl !== null && ttl !== undefined) {
    ttl = (typeof ttl === 'string' ? (Date.now() + ms(ttl)) : null) ||
      (ttl > TEN_YEARS_MS ? ttl : Date.now() + ttl);
    return Math.floor(new Date(ttl).getTime() / 1000);
  } else {
    return null;
  }
}

function createLogger(level = null) {
  /* istanbul ignore next */
  const make = (log, allowed) => allowed.includes(level) ? args => log(JSON.stringify(args, null, 2)) : () => null;
  /* eslint-disable no-console */
  return {
    debug: make(console.log, [ 'debug' ]),
    info: make(console.log, [ 'debug', 'info' ]),
    warn: make(console.warn, [ 'debug', 'info', 'warn' ]),
    error: make(console.error, [ 'debug', 'info', 'warn', 'error' ]),
  };
}

function isDynamoDB(value) {
  return value && value instanceof AWS.DynamoDB;
}

function isSet(value) {
  return value && value instanceof Set;
}

module.exports = {
  assert,
  buildTTL,
  createLogger,
  isDynamoDB,
  isPlainObject,
  isSet,
  marshall,
  packageName,
  unmarshall,
};
