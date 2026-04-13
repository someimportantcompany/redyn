import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function hvals(client: DynamoDBDocumentClient, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk, #value',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};
  return isPlainObject(value) ? Object.values(value) : null;
}
