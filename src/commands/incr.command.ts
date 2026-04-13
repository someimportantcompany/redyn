import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function incrby(client: DynamoDBDocumentClient, tableName: string, key: string, incr: number = 1) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof incr === 'number', new TypeError('Expected incr to be a number'));

  const result = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_not_exists(#pk) OR attribute_type(#value, :type)',
      UpdateExpression: 'SET #value = if_not_exists(#value, :start) + :incr',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: { ':start': 0, ':type': 'N', ':incr': incr },
      ReturnValues: 'UPDATED_NEW',
    }),
  );

  const { value } = isPlainObject(result?.Attributes) ? result.Attributes : {};
  return value ?? null;
}

export async function incr(client: DynamoDBDocumentClient, tableName: string, key: string) {
  return incrby(client, tableName, key, 1);
}
