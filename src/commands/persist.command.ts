import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert } from '../utils';

export async function persist(client: DynamoDBDocumentClient, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_exists(#pk)',
      UpdateExpression: 'REMOVE #ttl',
      ExpressionAttributeNames: { '#pk': 'pk', '#ttl': 'ttl' },
    }),
  );

  return true;
}
