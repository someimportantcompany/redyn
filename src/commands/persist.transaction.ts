import type { TransactionWriteHandler } from '../types';
import { pk, assert } from '../utils';

export async function persist(handler: TransactionWriteHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  await handler({
    Update: {
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_exists(#pk)',
      UpdateExpression: 'REMOVE #ttl',
      ExpressionAttributeNames: { '#pk': 'pk', '#ttl': 'ttl' },
    },
  });

  return true;
}
