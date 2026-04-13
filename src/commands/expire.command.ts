import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert } from '../utils';

export async function expire(client: DynamoDBDocumentClient, tableName: string, key: string, seconds: number) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof seconds === 'number' && seconds >= 0, new TypeError('Expected seconds to be an unsigned number'));

  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_exists(#pk)',
      UpdateExpression: 'SET #ttl = :ttl',
      ExpressionAttributeNames: { '#pk': 'pk', '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':ttl': Math.floor(Date.now() / 1000) + seconds },
    }),
  );

  return true;
}
