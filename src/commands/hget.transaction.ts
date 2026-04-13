import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function hget(handler: TransactionGetHandler, tableName: string, key: string, field: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof field === 'string' && field.length, new TypeError('Expected field to be a string'));

  const result = await handler({
    Get: {
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk, #value.#field',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value', '#field': field },
    },
  });

  const { value } = isPlainObject(result) ? result : {};
  return isPlainObject(value) ? (value[field] ?? null) : null;
}

export async function hstrlen(handler: TransactionGetHandler, tableName: string, key: string, field: string) {
  const value = await hget(handler, tableName, key, field);
  return typeof value === 'string' ? value.length : 0;
}
