import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function hgetall(handler: TransactionGetHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await handler({
    Get: {
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk, #value',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
    },
  });

  const { value } = isPlainObject(result) ? result : {};
  return isPlainObject(value) ? value : null;
}

export async function hkeys(handler: TransactionGetHandler, tableName: string, key: string) {
  const value = await hgetall(handler, tableName, key);
  return value ? Object.keys(value) : null;
}

export async function hlen(handler: TransactionGetHandler, tableName: string, key: string) {
  const value = await hgetall(handler, tableName, key);
  return value ? Object.keys(value).length : 0;
}

export async function hvals(handler: TransactionGetHandler, tableName: string, key: string) {
  const value = await hgetall(handler, tableName, key);
  return value ? Object.values(value) : null;
}
