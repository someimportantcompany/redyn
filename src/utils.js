const AWS = require('aws-sdk');
const isPlainObject = require('lodash.isplainobject');
const ms = require('ms');
const { name: packageName } = require('../package.json');

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

function formatKeyValueObject(pairs) {
  assert(Array.isArray(pairs), new TypeError('Expected pairs to be an array'));

  if (Array.isArray(pairs) && pairs.length === 1 && isPlainObject(pairs[0])) {
    return Object.keys(pairs[0]).map(key => ({ key, value: pairs[0][key] }));
  } else {
    assert(pairs.length % 2 === 0, new TypeError('Expected every pair to have a key & value'));

    pairs = pairs.reduce((r, v, i) => {
      if (i % 2 === 0) {
        r.push({ key: v });
      } else {
        r[r.length - 1].value = v;
      }
      return r;
    }, []);

    return pairs;
  }
}

function isDynamoDB(value) {
  return value && value instanceof AWS.DynamoDB;
}

function isSet(value) {
  return value && value instanceof Set;
}

function marshall(input) {
  assert(isPlainObject(input), new TypeError('Expected input to be a plain object'));

  const transform = value => {
    if (isPlainObject(value)) {
      return { M: marshall(value) };
    } else if (value instanceof Set) {
      const values = [ ...value ];
      const getType = val => val instanceof Buffer ? 'Buffer' : typeof val;
      const validSetTypes = [ 'string', 'number', 'Buffer' ];

      const type = getType(values[0]);
      assert(validSetTypes.includes(type), new TypeError('Expected set to be all strings, all numbers or all Buffers'));
      values.forEach(v => assert(getType(v) === type, new TypeError(`Expected each value of the set to be a ${type}`)));

      if (type === 'Buffer') {
        return { BS: values.map(v => v.toString('base64')) };
      } else if (type === 'number') {
        return { NS: values.map(v => `${v}`) };
      } else {
        return { SS: values };
      }
    } else if (Array.isArray(value)) {
      return { L: value.map(v => transform(v)) };
    } else if (value instanceof Buffer) {
      return { B: value.toString('base64') };
    } else if (value === null) {
      return { NULL: true };
    } else {
      const type = typeof value;
      if (type === 'boolean') {
        return { BOOL: value === true };
      } else if (type === 'string') {
        return { S: value };
      } else if (type === 'number') {
        return { N: `${value}` };
      } else {
        return {};
      }
    }
  };

  for (const key in input) {
    /* istanbul ignore else */
    if (input.hasOwnProperty(key) && input[key] !== undefined) {
      input[key] = transform(input[key]);
    }
  }

  return input;
}

function unmarshall(input) {
  assert(isPlainObject(input), new TypeError('Expected input to be a marshalled value'));

  const transform = value => {
    assert(isPlainObject(value), new TypeError('Expected marshalled value to be a plain object'));
    assert(Object.keys(value).length <= 1, new TypeError('Expected marshalled object to have a single key'));

    if (value.hasOwnProperty('M')) {
      const { M: map } = value;
      assert(isPlainObject(map), new TypeError('Expected marshalled value to be a plain object'));
      return unmarshall(map);
    } else if (value.hasOwnProperty('SS') || value.hasOwnProperty('NS')) {
      const { SS: strings, NS: numbers } = value;
      assert(!value.hasOwnProperty('SS') || Array.isArray(strings), new TypeError('Expected SS key to be an array'));
      assert(!value.hasOwnProperty('NS') || Array.isArray(numbers), new TypeError('Expected NS key to be an array'));
      return new Set([].concat(strings || [], (numbers || []).map(n => `${n}`.includes('.') ? parseFloat(n) : parseInt(n, 10))));
    } else if (value.hasOwnProperty('BS')) {
      const { BS: buffers } = value;
      assert(Array.isArray(buffers), new TypeError('Expected BS key to be an array'));
      buffers.forEach(buf => assert(buf instanceof Buffer || typeof buf === 'string',
        new TypeError('Expected every BS item to be a Buffer or string buffers')));
      return new Set(buffers.map(buf => buf instanceof Buffer ? buf : Buffer.from(buf, 'base64')));
    } else if (value.hasOwnProperty('L')) {
      const { L: list } = value;
      assert(Array.isArray(list), new TypeError('Expected L key to be an array'));
      return list.map(v => transform(v));
    } else if (value.hasOwnProperty('NULL')) {
      const { NULL: nullValue } = value;
      assert(nullValue === true, new TypeError('Expected NULL key to be true'));
      return null;
    } else if (value.hasOwnProperty('BOOL')) {
      const { BOOL: boolValue } = value;
      assert(typeof boolValue === 'boolean', new TypeError('Expected BOOL key to be a boolean value'));
      return boolValue === true;
    } else if (value.hasOwnProperty('S')) {
      const { S: string } = value;
      assert(typeof string === 'string', new TypeError('Expected S key to be a string value'));
      return string;
    } else if (value.hasOwnProperty('N')) {
      const number = `${value.N}`.includes('.') ? parseFloat(value.N) : parseInt(value.N, 10);
      assert(typeof number === 'number', new TypeError('Expected N key to be a number value'));
      return number;
    } else if (value.hasOwnProperty('B')) {
      const { B: buf } = value;
      assert(buf instanceof Buffer || typeof buf === 'string',
        new TypeError('Expected B key to be a Buffer or string value'));
      return buf instanceof Buffer ? buf : Buffer.from(buf, 'base64');
    } else {
      return undefined;
    }
  };

  for (const key in input) {
    /* istanbul ignore else */
    if (input.hasOwnProperty(key) && input[key] !== undefined) {
      input[key] = transform(input[key]);
    }
  }

  return input;
}

module.exports = {
  assert,
  buildTTL,
  createLogger,
  formatKeyValueObject,
  isDynamoDB,
  isPlainObject,
  isSet,
  marshall,
  packageName,
  unmarshall,
};
