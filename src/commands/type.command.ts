import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function type(client: DynamoDBDocumentClient, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk,#value',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ConsistentRead: true,
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};

  if (typeof value === 'string' || typeof value === 'number') {
    return 'string';
  } else if (value instanceof Set) {
    return 'set';
  } else if (Array.isArray(value)) {
    return 'list';
  } else if (isPlainObject(value)) {
    return 'hash';
  }

  return null;
}
