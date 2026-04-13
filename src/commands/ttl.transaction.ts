import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function ttl(handler: TransactionGetHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await handler({
    Get: {
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk,#ttl',
      ExpressionAttributeNames: { '#pk': 'pk', '#ttl': 'ttl' },
    },
  });

  const { ttl: ttlValue } = isPlainObject(result) ? result : {};
  const now = Math.floor(Date.now() / 1000);
  return typeof ttlValue === 'number' && ttlValue > now ? ttlValue - now : -1;
}
