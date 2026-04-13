import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function lrange(handler: TransactionGetHandler, tableName: string, key: string, start: number, end: number) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof start === 'number', new TypeError('Expected start to be a number'));
  assert(typeof end === 'number', new TypeError('Expected end to be a number'));

  const result = await handler({ Get: { TableName: tableName, Key: { pk, sk: key } } });
  const { value } = isPlainObject(result) ? result : {};
  assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), { code: 'WRONGTYPE' });

  let resolvedEnd = end;
  if (Array.isArray(value) && value.length && resolvedEnd < 0) {
    resolvedEnd = value.length + resolvedEnd;
  }

  return Array.isArray(value) ? value.slice(start, resolvedEnd + 1) : [];
}
