import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function rename(client: DynamoDBDocumentClient, tableName: string, key: string, newKey: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof newKey === 'string' && newKey.length, new TypeError('Expected newKey to be a string'));

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConsistentRead: true,
    }),
  );

  assert(isPlainObject(result?.Item), new Error('No such key'));

  const { value, ttl } = result.Item;

  await client.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: tableName,
            Key: { pk, sk: key },
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: { pk, sk: newKey, value, ...(ttl !== undefined ? { ttl } : {}) },
          },
        },
      ],
    }),
  );

  return true;
}
