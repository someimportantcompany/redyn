import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function exists(handler: TransactionGetHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await handler({
    Get: {
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk',
      ExpressionAttributeNames: { '#pk': 'pk' },
    },
  });

  return isPlainObject(result) && result.pk ? 1 : 0;
}
