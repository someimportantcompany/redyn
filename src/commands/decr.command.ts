import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function decrby(client: DynamoDBDocumentClient, tableName: string, key: string, decr: number = 1) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof decr === 'number', new TypeError('Expected decr to be a number'));

  const result = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_not_exists(#pk) OR attribute_type(#value, :type)',
      UpdateExpression: 'SET #value = if_not_exists(#value, :start) - :decr',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: { ':start': 0, ':type': 'N', ':decr': decr },
      ReturnValues: 'UPDATED_NEW',
    }),
  );

  const { value } = isPlainObject(result?.Attributes) ? result.Attributes : {};
  return value ?? null;
}

export async function decr(client: DynamoDBDocumentClient, tableName: string, key: string) {
  return decrby(client, tableName, key, 1);
}
