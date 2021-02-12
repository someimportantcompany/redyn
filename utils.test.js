const assert = require('assert');
const utils = require('./utils');

describe('utils', () => {
  describe('marshall', () => {
    const { marshall } = utils;
    before(() => assert(typeof marshall === 'function', 'Expected marshall to be a function'));

    it('should transform an object of native types', () => {
      const result = marshall({
        a: 'hello',
        b: 2,
        c: 2.2,
        d: false,
        e: null,
        f: Buffer.from('hello-world'),
        g: new Set([ 'a', 'b', 'c' ]),
        h: new Set([ 1, 2, 3, 4, 5, 6.5 ]),
        i: new Set([ Buffer.from('hello'), Buffer.from('world') ]),
        j: [ 1, 2, 3 ],
        k: { ja: 'foo', jb: 1024 },
        l: () => null,
      });
      assert.deepStrictEqual(result, {
        a: { S: 'hello' },
        b: { N: '2' },
        c: { N: '2.2' },
        d: { BOOL: false },
        e: { NULL: true },
        f: { B: 'aGVsbG8td29ybGQ=' },
        g: { SS: [ 'a', 'b', 'c' ] },
        h: { NS: [ '1', '2', '3', '4', '5', '6.5' ] },
        i: { BS: [ 'aGVsbG8=', 'd29ybGQ=' ] },
        j: { L: [ { N: '1' }, { N: '2' }, { N: '3' } ] },
        k: { M: { ja: { S: 'foo' }, jb: { N: '1024' } } },
        l: {},
      });
    });
  });

  describe('unmarshall', () => {
    const { unmarshall } = utils;
    before(() => assert(typeof unmarshall === 'function', 'Expected unmarshall to be a function'));

    it('should transform an object of native types', () => {
      const result = unmarshall({
        a: { S: 'hello' },
        b: { N: '2' },
        c: { N: '2.2' },
        d: { BOOL: false },
        e: { NULL: true },
        f: { B: 'aGVsbG8td29ybGQ=' },
        g: { SS: [ 'a', 'b', 'c' ] },
        h: { NS: [ '1', '2', '3', '4', '5', '6.5' ] },
        i: { BS: [ 'aGVsbG8=', 'd29ybGQ=' ] },
        j: { L: [ { N: '1' }, { N: '2' }, { N: '3' } ] },
        k: { M: { ja: { S: 'foo' }, jb: { N: '1024' } } },
        l: {},
      });
      assert.deepStrictEqual(result, {
        a: 'hello',
        b: 2,
        c: 2.2,
        d: false,
        e: null,
        f: Buffer.from('hello-world'),
        g: new Set([ 'a', 'b', 'c' ]),
        h: new Set([ 1, 2, 3, 4, 5, 6.5 ]),
        i: new Set([ Buffer.from('hello'), Buffer.from('world') ]),
        j: [ 1, 2, 3 ],
        k: { ja: 'foo', jb: 1024 },
        l: undefined,
      });
    });
  });
});
