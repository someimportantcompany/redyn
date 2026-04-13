import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function get(
  client: DynamoDBDocumentClient,
  tableName: string,
  key: string,
  opts?: { consistentRead?: boolean },
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
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
  return ['string', 'number'].includes(typeof value) ? value : null;
}

export async function strlen(
  client: DynamoDBDocumentClient,
  tableName: string,
  key: string,
  opts?: { consistentRead?: boolean },
) {
  const value = await get(client, tableName, key, opts);
  return value ? `${value}`.length : 0;
}
