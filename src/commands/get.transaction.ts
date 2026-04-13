import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function get(handler: TransactionGetHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await handler({ Get: { TableName: tableName, Key: { pk, sk: key } } });
  const { value } = isPlainObject(result) ? result : {};
  return ['string', 'number'].includes(typeof value) ? value : null;
}

export async function strlen(handler: TransactionGetHandler, tableName: string, key: string) {
  const value = await get(handler, tableName, key);
  return value ? `${value}`.length : 0;
}
