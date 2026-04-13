import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function llen(handler: TransactionGetHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await handler({ Get: { TableName: tableName, Key: { pk, sk: key } } });
  const { value } = isPlainObject(result) ? result : {};
  assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), { code: 'WRONGTYPE' });

  return Array.isArray(value) ? value.length : null;
}
