import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function hstrlen(client: DynamoDBDocumentClient, tableName: string, key: string, field: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof field === 'string' && field.length, new TypeError('Expected field to be a string'));

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: '#pk, #value.#field',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value', '#field': field },
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};
  return isPlainObject(value) && typeof value[field] === 'string' ? value[field].length : 0;
}
