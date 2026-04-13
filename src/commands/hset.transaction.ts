import type { TransactionWriteHandler } from '../types';
import { pk, assert } from '../utils';

export async function hset(
  handler: TransactionWriteHandler,
  tableName: string,
  key: string,
  ...items: Array<{ key: string; value: unknown }>
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(Array.isArray(items) && items.length, new TypeError('Expected an array of items'));
  assert(items.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));

  await handler({
    Update: {
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_not_exists(#pk)',
      UpdateExpression: 'SET #value = :values',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: {
        ':values': items.reduce((r, { key: k, value: v }) => ({ ...r, [k]: v }), {} as Record<string, unknown>),
      },
    },
  });

  return true;
}
