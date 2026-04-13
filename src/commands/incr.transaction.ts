import type { TransactionWriteHandler } from '../types';
import { pk, assert } from '../utils';

export async function incrby(handler: TransactionWriteHandler, tableName: string, key: string, incr: number = 1) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof incr === 'number', new TypeError('Expected incr to be a number'));

  await handler({
    Update: {
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_not_exists(#pk) OR attribute_type(#value, :type)',
      UpdateExpression: 'SET #value = if_not_exists(#value, :start) + :incr',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: { ':start': 0, ':type': 'N', ':incr': incr },
    },
  });

  return true;
}

export function incr(handler: TransactionWriteHandler, tableName: string, key: string) {
  return incrby(handler, tableName, key, 1);
}
