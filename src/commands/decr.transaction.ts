import type { TransactionWriteHandler } from '../types';
import { pk, assert } from '../utils';

export async function decrby(handler: TransactionWriteHandler, tableName: string, key: string, decr: number = 1) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof decr === 'number', new TypeError('Expected decr to be a number'));

  await handler({
    Update: {
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_not_exists(#pk) OR attribute_type(#value, :type)',
      UpdateExpression: 'SET #value = if_not_exists(#value, :start) - :decr',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: { ':start': 0, ':type': 'N', ':decr': decr },
    },
  });

  return true;
}

export function decr(handler: TransactionWriteHandler, tableName: string, key: string) {
  return decrby(handler, tableName, key, 1);
}
