import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject, getSetType } from '../utils';

export async function scard(client: DynamoDBDocumentClient, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConsistentRead: true,
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};
  return value instanceof Set ? value.size : 0;
}

export async function sismember(client: DynamoDBDocumentClient, tableName: string, key: string, member: unknown) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  getSetType(member);

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConsistentRead: true,
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};
  return value instanceof Set && value.has(member);
}

export async function smismember(
  client: DynamoDBDocumentClient,
  tableName: string,
  key: string,
  ...members: unknown[]
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(Array.isArray(members) && members.length, new TypeError('Expected members to be an array'));
  members.forEach((member) =>
    assert(getSetType(member), new TypeError('Expected each member to be a string, number or Buffer')),
  );

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConsistentRead: true,
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};
  return members.map((member) => value instanceof Set && value.has(member));
}
