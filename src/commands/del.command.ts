import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert } from '../utils';

export async function del(client: DynamoDBDocumentClient, tableName: string, ...keys: string[]) {
  assert(Array.isArray(keys) && keys.length, new TypeError('Expected an array of keys'));
  assert(keys.length <= 25, new TypeError('Expected keys to be less-than-or-equal-to 25 keys'));
  keys.forEach((key) => assert(typeof key === 'string' && key.length, new TypeError('Expected each key to be a string')));

  await client.send(
    new TransactWriteCommand({
      TransactItems: keys.map((key) => ({
        Delete: {
          TableName: tableName,
          Key: { pk, sk: key },
        },
      })),
    }),
  );

  return true;
}
