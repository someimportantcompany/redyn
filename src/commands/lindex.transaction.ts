import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function lindex(handler: TransactionGetHandler, tableName: string, key: string, i: number) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof i === 'number', new TypeError('Expected i to be a number'));

  const result = await handler({ Get: { TableName: tableName, Key: { pk, sk: key } } });
  const { value } = isPlainObject(result) ? result : {};
  assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), { code: 'WRONGTYPE' });

  return Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, i) ? value[i] : null;
}
