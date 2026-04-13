import type { TransactionWriteHandler } from '../types';
import { pk, assert, isPlainObject } from '../utils';

export async function set(
  handler: TransactionWriteHandler,
  tableName: string,
  key: string,
  value: string | number,
  opts?: { ex?: number; exat?: number },
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(
    typeof value === 'string' || typeof value === 'number',
    new TypeError('Expected value to be a string or number'),
  );
  assert(opts === undefined || isPlainObject(opts), new TypeError('Expected opts to be a plain object'));
  assert(!(opts?.ex && opts?.exat), new Error('EX / EXAT are exclusive'));

  const ttl = opts?.exat ?? (opts?.ex ? Math.floor(Date.now() / 1000) + opts.ex : undefined);

  await handler({ Put: { TableName: tableName, Item: { pk, sk: key, value, ttl } } });
  return true;
}
