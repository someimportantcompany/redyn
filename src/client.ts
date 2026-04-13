import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import * as commands from './commands/index.commands';
import * as transactions from './commands/index.transactions';

export default class RedynClient {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client: DynamoDBDocumentClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  // Strings
  get = this.wrap(commands.get);
  set = this.wrap(commands.set);
  strlen = this.wrap(commands.strlen);
  incr = this.wrap(commands.incr);
  incrby = this.wrap(commands.incrby);
  decr = this.wrap(commands.decr);
  decrby = this.wrap(commands.decrby);

  // Lists
  rpush = this.wrap(commands.rpush);
  lpush = this.wrap(commands.lpush);
  rpushx = this.wrap(commands.rpushx);
  lpushx = this.wrap(commands.lpushx);
  lindex = this.wrap(commands.lindex);
  llen = this.wrap(commands.llen);
  lrange = this.wrap(commands.lrange);
  lset = this.wrap(commands.lset);

  // Hashmaps
  hget = this.wrap(commands.hget);
  hgetall = this.wrap(commands.hgetall);
  hincrby = this.wrap(commands.hincrby);
  hkeys = this.wrap(commands.hkeys);
  hlen = this.wrap(commands.hlen);
  hmget = this.wrap(commands.hmget);
  hset = this.wrap(commands.hset);
  hstrlen = this.wrap(commands.hstrlen);
  hvals = this.wrap(commands.hvals);

  // Sets
  sadd = this.wrap(commands.sadd);
  scard = this.wrap(commands.scard);
  sismember = this.wrap(commands.sismember);
  smismember = this.wrap(commands.smismember);
  srem = this.wrap(commands.srem);

  // Misc
  del = this.wrap(commands.del);
  exists = this.wrap(commands.exists);
  expire = this.wrap(commands.expire);
  expireat = this.wrap(commands.expireat);
  persist = this.wrap(commands.persist);
  rename = this.wrap(commands.rename);
  renamenx = this.wrap(commands.renamenx);
  ttl = this.wrap(commands.ttl);
  type = this.wrap(commands.type);

  // Transactions
  tx = {
    // Strings
    get: this.wrapTx(transactions.get),
    set: this.wrapTx(transactions.set),
    strlen: this.wrapTx(transactions.strlen),
    incr: this.wrapTx(transactions.incr),
    incrby: this.wrapTx(transactions.incrby),
    decr: this.wrapTx(transactions.decr),
    decrby: this.wrapTx(transactions.decrby),

    // Lists
    rpush: this.wrapTx(transactions.rpush),
    lpush: this.wrapTx(transactions.lpush),
    rpushx: this.wrapTx(transactions.rpushx),
    lpushx: this.wrapTx(transactions.lpushx),
    lindex: this.wrapTx(transactions.lindex),
    llen: this.wrapTx(transactions.llen),
    lrange: this.wrapTx(transactions.lrange),
    lset: this.wrapTx(transactions.lset),

    // Hashmaps
    hget: this.wrapTx(transactions.hget),
    hgetall: this.wrapTx(transactions.hgetall),
    hincrby: this.wrapTx(transactions.hincrby),
    hkeys: this.wrapTx(transactions.hkeys),
    hlen: this.wrapTx(transactions.hlen),
    hmget: this.wrapTx(transactions.hmget),
    hset: this.wrapTx(transactions.hset),
    hstrlen: this.wrapTx(transactions.hstrlen),
    hvals: this.wrapTx(transactions.hvals),

    // Sets
    sadd: this.wrapTx(transactions.sadd),
    scard: this.wrapTx(transactions.scard),
    sismember: this.wrapTx(transactions.sismember),
    smismember: this.wrapTx(transactions.smismember),
    srem: this.wrapTx(transactions.srem),

    // Misc
    del: this.wrapTx(transactions.del),
    exists: this.wrapTx(transactions.exists),
    expire: this.wrapTx(transactions.expire),
    expireat: this.wrapTx(transactions.expireat),
    persist: this.wrapTx(transactions.persist),
    rename: this.wrapTx(transactions.rename),
    renamenx: this.wrapTx(transactions.renamenx),
    ttl: this.wrapTx(transactions.ttl),
    type: this.wrapTx(transactions.type),
  };

  private wrap<A extends unknown[], R>(
    fn: (client: DynamoDBDocumentClient, tableName: string, ...args: A) => R,
  ): (...args: A) => R {
    return (...args) => fn(this.client, this.tableName, ...args);
  }

  private wrapTx<H, A extends unknown[], R>(
    fn: (handler: H, tableName: string, ...args: A) => R,
  ): (handler: H, ...args: A) => R {
    return (handler, ...args) => fn(handler, this.tableName, ...args);
  }
}
