import { DynamoDBDocumentClient, TransactGetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function exists(client: DynamoDBDocumentClient, tableName: string, ...keys: string[]) {
  assert(Array.isArray(keys) && keys.length, new TypeError('Expected an array of keys'));
  assert(keys.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));
  keys.forEach((key) => assert(typeof key === 'string' && key.length, new TypeError('Expected each key to be a string')));

  const result = await client.send(
    new TransactGetCommand({
      TransactItems: keys.map((key) => ({
        Get: {
          TableName: tableName,
          Key: { pk, sk: key },
          ProjectionExpression: '#pk',
          ExpressionAttributeNames: { '#pk': 'pk' },
        },
      })),
    }),
  );

  assert(result && Array.isArray(result.Responses), new TypeError('Expected transactGetItems results to be an array'));
  return result.Responses.reduce((count, { Item }) => count + (isPlainObject(Item) && Item.pk ? 1 : 0), 0);
}
