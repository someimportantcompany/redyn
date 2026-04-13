import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function set(
  client: DynamoDBDocumentClient,
  tableName: string,
  key: string,
  value: string | number,
  opts?: { ex?: number; exat?: number; nx?: boolean; xx?: boolean },
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(
    typeof value === 'string' || typeof value === 'number',
    new TypeError('Expected value to be a string or number'),
  );
  assert(opts === undefined || isPlainObject(opts), new TypeError('Expected opts to be a plain object'));
  assert(opts?.ex === undefined || typeof opts.ex === 'number', new TypeError('Expected EX to be a number'));
  assert(opts?.exat === undefined || typeof opts.exat === 'number', new TypeError('Expected EXAT to be a number'));
  assert(opts?.nx === undefined || typeof opts.nx === 'boolean', new TypeError('Expected NX to be a boolean'));
  assert(opts?.xx === undefined || typeof opts.xx === 'boolean', new TypeError('Expected XX to be a boolean'));
  assert(!(opts?.ex && opts?.exat), new Error('EX / EXAT are exclusive'));
  assert(!(opts?.nx && opts?.xx), new Error('NX / XX are exclusive'));

  const ttl = opts?.exat ?? (opts?.ex ? Math.floor(Date.now() / 1000) + opts.ex : undefined);

  await client.send(
    new PutCommand({
      TableName: tableName,
      Item: { pk, sk: key, value, ttl },
    }),
  );

  return true;
}
