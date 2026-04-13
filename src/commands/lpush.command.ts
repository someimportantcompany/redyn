import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function lpush(client: DynamoDBDocumentClient, tableName: string, key: string, ...elements: unknown[]) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(Array.isArray(elements) && elements.length, new TypeError('Expected elements to be an array'));
  assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

  const reversed = [...elements].reverse();

  const result = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_not_exists(#pk) OR attribute_type(#value, :type)',
      UpdateExpression: 'SET #value = list_append(:prepend, if_not_exists(#value, :start))',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: { ':start': [], ':type': 'L', ':prepend': reversed },
      ReturnValues: 'UPDATED_NEW',
    }),
  );

  const { value } = isPlainObject(result?.Attributes) ? result.Attributes : {};
  return Array.isArray(value) ? value.length : 0;
}
