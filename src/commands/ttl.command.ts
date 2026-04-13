import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function ttl(client: DynamoDBDocumentClient, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk,#ttl',
      ExpressionAttributeNames: { '#pk': 'pk', '#ttl': 'ttl' },
      ConsistentRead: true,
    }),
  );

  const { ttl: ttlValue } = isPlainObject(result?.Item) ? result.Item : {};
  const now = Math.floor(Date.now() / 1000);
  return typeof ttlValue === 'number' && ttlValue > now ? ttlValue - now : -1;
}
