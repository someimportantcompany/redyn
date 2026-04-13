import type { TransactionWriteHandler } from '../types';
import { pk, assert } from '../utils';

export async function del(handler: TransactionWriteHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  await handler({
    Delete: {
      TableName: tableName,
      Key: { pk, sk: key },
    },
  });

  return true;
}
