import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function lrange(
  client: DynamoDBDocumentClient,
  tableName: string,
  key: string,
  start: number,
  end: number,
  opts?: { consistentRead?: boolean },
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(typeof start === 'number', new TypeError('Expected start to be a number'));
  assert(typeof end === 'number', new TypeError('Expected end to be a number'));
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

  let resolvedEnd = end;
  if (Array.isArray(value) && value.length && resolvedEnd < 0) {
    resolvedEnd = value.length + resolvedEnd;
  }

  // LRANGE list 0 10 will return 11 elements, that is, the rightmost item is included
  return Array.isArray(value) ? value.slice(start, resolvedEnd + 1) : [];
}
