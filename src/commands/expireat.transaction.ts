import type { TransactionWriteHandler } from '../types';
import { pk, assert } from '../utils';

export async function expireat(handler: TransactionWriteHandler, tableName: string, key: string, timestamp: Date) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(timestamp instanceof Date, new TypeError('Expected timestamp to be a Date'));

  await handler({
    Update: {
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_exists(#pk)',
      UpdateExpression: 'SET #ttl = :ttl',
      ExpressionAttributeNames: { '#pk': 'pk', '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':ttl': Math.floor(timestamp.getTime() / 1000) },
    },
  });

  return true;
}
