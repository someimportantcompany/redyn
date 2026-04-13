import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function lindex(
  client: DynamoDBDocumentClient,
  tableName: string,
  key: string,
  i: number,
  opts?: { consistentRead?: boolean },
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof i === 'number', new TypeError('Expected i to be a number'));
  assert(opts === undefined || isPlainObject(opts), new TypeError('Expected opts to be a plain object'));
  assert(
    opts?.consistentRead === undefined || typeof opts.consistentRead === 'boolean',
    new TypeError('Expected opts.consistentRead to be a boolean'),
  );

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ConsistentRead: opts?.consistentRead,
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};
  assert(value === undefined || Array.isArray(value), new Error(`Expected ${key} to be a list`), { code: 'WRONGTYPE' });

  return Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, i) ? value[i] : null;
}
