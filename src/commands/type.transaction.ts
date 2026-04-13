import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function type(handler: TransactionGetHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await handler({
    Get: {
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk,#value',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
    },
  });

  const { value } = isPlainObject(result) ? result : {};

  if (typeof value === 'string' || typeof value === 'number') {
    return 'string';
  } else if (value instanceof Set) {
    return 'set';
  } else if (Array.isArray(value)) {
    return 'list';
  } else if (isPlainObject(value)) {
    return 'hash';
  }

  return null;
}
