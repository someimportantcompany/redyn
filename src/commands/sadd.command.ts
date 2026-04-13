import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, getSetType } from '../utils';

export async function sadd(client: DynamoDBDocumentClient, tableName: string, key: string, ...members: unknown[]) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(Array.isArray(members) && members.length, new TypeError('Expected an array of members'));

  const type = getSetType(members[0]);
  members.forEach((v) => assert(getSetType(v) === type, new TypeError(`Expected all members to be a ${type}`)));

  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConditionExpression: 'attribute_not_exists(#pk) OR attribute_type(#value, :type)',
      UpdateExpression: 'ADD #value :members',
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value' },
      ExpressionAttributeValues: { ':type': type, ':members': new Set(members) },
    }),
  );

  return true;
}
