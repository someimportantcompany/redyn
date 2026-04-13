import type { TransactionWriteHandler } from '../types';
import { pk, assert } from '../utils';

export async function hincrby(
  handler: TransactionWriteHandler,
  tableName: string,
  key: string,
  field: string,
  incr: number,
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof field === 'string' && field.length, new TypeError('Expected field to be a string'));
  assert(typeof incr === 'number', new TypeError('Expected incr to be a number'));

  await handler({
    Update: {
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_exists(#pk) AND attribute_type(#value, :type)',
      UpdateExpression: 'SET #value.#field = if_not_exists(#value.#field, :start) + :incr',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value', '#field': field },
      ExpressionAttributeValues: { ':start': 0, ':type': 'M', ':incr': incr },
    },
  });

  return true;
}
