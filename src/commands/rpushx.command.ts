import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function rpushx(client: DynamoDBDocumentClient, tableName: string, key: string, ...elements: unknown[]) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(Array.isArray(elements) && elements.length, new TypeError('Expected elements to be an array'));
  assert(elements.length <= 25, new TypeError('Expected elements to be less-than-or-equal-to 25 items'));

  try {
    const result = await client.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk, sk: key },
        ConditionExpression: 'attribute_exists(#pk) AND attribute_type(#value, :type)',
        UpdateExpression: 'SET #value = list_append(if_not_exists(#value, :start), :append)',
        ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
        ExpressionAttributeValues: { ':start': [], ':type': 'L', ':append': elements },
        ReturnValues: 'UPDATED_NEW',
      }),
    );

    const { value } = isPlainObject(result?.Attributes) ? result.Attributes : {};
    return Array.isArray(value) ? value.length : 0;
  } catch (err) {
    assert((err as { name: string }).name === 'ConditionalCheckFailedException', err as Error);
    return false;
  }
}
