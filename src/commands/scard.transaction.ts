import type { TransactionGetHandler } from '../types';
import { pk, assert, isPlainObject, getSetType } from '../utils';

export async function scard(handler: TransactionGetHandler, tableName: string, key: string) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));

  const result = await handler({ Get: { TableName: tableName, Key: { pk, sk: key } } });
  const { value } = isPlainObject(result) ? result : {};
  return value instanceof Set ? value.size : 0;
}

export async function sismember(handler: TransactionGetHandler, tableName: string, key: string, member: unknown) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  getSetType(member);

  const result = await handler({ Get: { TableName: tableName, Key: { pk, sk: key } } });
  const { value } = isPlainObject(result) ? result : {};
  return value instanceof Set && value.has(member);
}

export async function smismember(
  handler: TransactionGetHandler,
  tableName: string,
  key: string,
  ...members: unknown[]
) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(Array.isArray(members) && members.length, new TypeError('Expected members to be an array'));
  members.forEach((member) =>
    assert(getSetType(member), new TypeError('Expected each member to be a string, number or Buffer')),
  );

  const result = await handler({ Get: { TableName: tableName, Key: { pk, sk: key } } });
  const { value } = isPlainObject(result) ? result : {};
  return members.map((member) => value instanceof Set && value.has(member));
}
