import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert } from '../utils';

export async function lset(client: DynamoDBDocumentClient, tableName: string, key: string, i: number, value: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof i === 'number', new TypeError('Expected index to be a number'));
  assert(typeof value === 'string' && value.length, new TypeError('Expected value to be a string'));

  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_exists(#pk) OR attribute_type(#value, :type)',
      UpdateExpression: `SET #value[${i}] = :value`,
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: { ':type': 'L', ':value': value },
    }),
  );

  return true;
}
