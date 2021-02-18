# redyn

[![NPM](https://badge.fury.io/js/redyn.svg)](https://npm.im/redyn)
[![CI](https://github.com/someimportantcompany/redyn/workflows/Test/badge.svg?branch=master)](https://github.com/someimportantcompany/redyn/actions?query=branch%3Amaster)
[![Docs](https://img.shields.io/static/v1?label=Read&message=Documentation&color=blue&logo=read-the-docs)](./docs/)

Promise-first [Redis](https://redis.io)-implementation for [NodeJS](https://nodejs.org) backed by [DynamoDB](https://aws.amazon.com/dynamodb).

```js
const redyn = require('redyn');
// Specify your DynamoDB table
const client = redyn.createClient('redyn-example-table');

// Start executing Redis commands!
await client.set('users:1', JSON.stringify({ id: 1, name: 'Barry Allen' }));
await client.set('users:2', JSON.stringify({ id: 2, name: 'Iris West' }));
await client.set('users:3', JSON.stringify({ id: 3, name: 'Cisco Ramon' }));
await client.set('users:4', JSON.stringify({ id: 4, name: 'Caitlin Snow' }));
await client.set('users:5', JSON.stringify({ id: 5, name: 'Harrison Wells' }));

const user = await client.get('users:1');
console.log(JSON.parse(user));
// { id: 1,
//   name: 'Barry Allen' }


await client.rpush('users', 1, 2, 3, 3, 4, 4, 5);
await client.lpush('users', 0);

const userIDs = await client.lrange('users', 0, -1);
console.log(JSON.parse(userIDs));
// [ 0, 1, 2, 3, 3, 4, 4, 5 ]


await client.sadd('users:unique', 1, 2, 3, 3, 4, 4, 5);

const uniqueUserIDs = await client.smembers('users:unique');
console.log(JSON.parse(uniqueUserIDs));
// [ 1, 2, 3, 4, 5 ]
```

This library is designed to use DynamoDB as a simple cache store - using a combination of DynamoDB patterns & expressions to store data in a similar pattern to Redis. There are various drawbacks, which are noted in the [Documentation](#documentation) below.

## Installation

```
npm install --save redyn
```

## Documentation

- [Getting Started](#getting-started)
- [Using strings](#using-strings)
- [Using lists](#using-lists)
- [Using hashmaps](#using-hashmaps)
- [Using sets](#using-sets)
- [Other methods](#other-methods)
- [Transactions](#transaction)

### Getting Started

Import or require redyn into your project:

```js
const redyn = require('redyn');
// or
import redyn from 'redyn';
```

**Configure**

| Exported | Description |
| ---- | ---- |
| `redyn.createClient(config)` | The main function used to create a client. |
| `redyn.setDynamoDB(client)` | A function to set the DynamoDB instance used in future `createClient` calls, see [Set DynamoDB](#set-dynamodb) below. |

**Create a client**

The `createClient` method is the starting point for all clients: It is a synchronous method that builds a client from the provided configuration object that defines which table will be used:

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-cache');
```

You must ensure your table has already been created following this [`createTable`](./createTable.json) specification.

**Set DynamoDB**

_redyn_ interacts with the AWS-SDK, by default it creates a new `AWS.DynamoDB` instance when you create a model. Check out AWS's "[Setting credentials in Node.js](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html)" documentation for more details. Since underneath DynamoDB is a handful of HTTPS calls, you can theoretically create as many instances as you like.

Alternatively you can pass a preconfigured `dynamodb` instance to save on resources:

```js
const AWS = require('aws-sdk');
const redyn = require('redyn');

// Perhaps the table for this model exists in another AWS region:
const dynamodb = new AWS.DynamoDB({ region: 'eu-west-2' });
const client = redyn.createClient({
  tableName: 'redyn-example-cache',
  dynamodb,
});

// Or perhaps you want to test your model against a local DynamoDB instance (such as dynamodb-local or localstack):
const dynamodb = new AWS.DynamoDB({ endpoint: 'http://localhost:8000' });
const client = redyn.createClient({
  tableName: 'redyn-example-cache',
  dynamodb,
});
```

Or you can set a `dynamodb` instance for **all future** `createModel` calls:

```js
const dynamodb = new AWS.DynamoDB({ endpoint: 'http://localhost:8000' });
redyn.setDynamoDB(dynamodb);

// And this will use the dynamodb instance specified
const client = redyn.createClient('redyn-example-cache');
// This is mostly useful for tests, so you can point your models to your local DynamoDB instance
// without littering your codebase with if-tests-then statements!
```

### Using strings

**`client.decr(key)`**

Decrements the number stored at `key` by one. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `WRITE` transactions.

**`client.decrby(key, decrement)`**

Decrements the number stored at `key` by `decrement`. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `decrement` | Number | **Required** |

This method supports `WRITE` transactions.

**`client.get(key[, opts])`**

Get the value of key. If the key does not exist then `null` is returned. An error is returned if the value stored at key is not a string, because `GET` only handles string values.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `opts.consistentRead` | Boolean | Optionally enforce consistent reads, ignored in [transactions](#transactions) |

This method supports `READ` transactions.

**`client.incr(key)`**

Increments the number stored at `key` by one. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `WRITE` transactions.

**`client.incrby(key, increment)`**

Increments the number stored at `key` by `increment`. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `increment` | Number | **Required** |

This method supports `WRITE` transactions.

**`client.mget(key[, key ...])`**

Returns the values of all specified keys. For every key that does not hold a string value or does not exist, `null` is returned. Because of this, the operation never fails.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** Each argument is a string representing the specific key |

**`client.mset(key, value[, key, value ... ...])`**

Sets the given keys to their respective values. `MSET` replaces existing values with new values, just as regular `SET`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** Each key argument is a string |
| `value` | String | **Required** Each value argument is a string |

**`client.set(key, value[, opts])`**

Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type. Any previous time to live associated with the key is discarded on successful `SET` operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `value` | String | **Required** |
| `opts.ex` | Number | Optionally set the spcified expire time, in seconds |
| `opts.exat` | Number | Optionally set the specified UNIX time at which the key will expire, in seconds |
| `opts.nx` | Boolean | Only set if the key does not already exist |
| `opts.xx` | Boolean | Only set if the key already exists |

- `PX` & `PXAT` is unsupported as DynamoDB's TTL feature does not support milliseconds.

This method supports `WRITE` transactions.

**`client.strlen(key)`**

Returns the length of the string value stored at `key`, or `0` when `key` does not exist. An error is returned when key holds a non-string value.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

### Using lists

**`client.lindex(key, index)`**

Returns the element at index index in the list stored at key. The index is zero-based, so 0 means the first element, 1 the second element and so on.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `index` | Number | **Required** |

**`client.llen(key, index)`**

Returns the length of the list stored at key. If key does not exist, it is interpreted as an empty list and 0 is returned. An error is returned when the value stored at key is not a list.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

**`client.lrange(key, start, stop)`**

Returns the specified elements of the list stored at `key`. The offsets `start` and `stop` are zero-based indexes, with 0 being the first element of the list (the head of the list), 1 being the next element and so on.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `start` | Number | **Required** |
| `stop` | Number | **Required** |

**`client.lpush(key, element[, element ...])`**

Insert all the specified values at the head of the list stored at `key`. If `key` does not exist, it is created as empty list before performing the push operation. When `key` holds a value that is not a list, an error is returned.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `element` | String | **At least 1 required**, each element must be a string |

This method supports `WRITE` transactions.

**`client.lpushx(key, element[, element ...])`**

Insert all the specified values at the head of the list stored at `key`, only if `key` already exists & holds a list.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `element` | String | **At least 1 required**, each element must be a string |

This method supports `WRITE` transactions.

**`client.lset(key, index, element)`**

Sets the list element at `index` to `element`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `index` | Number | **Required** |
| `element` | String | **At least 1 required**, each element must be a string |

This method supports `WRITE` transactions.

**`client.rpush(key, element[, element ...])`**

Insert all the specified values at the tail of the list stored at `key`. If `key` does not exist, it is created as empty list before performing the push operation. When `key` holds a value that is not a list, an error is returned.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `element` | String | **At least 1 required**, each element must be a string |

This method supports `WRITE` transactions.

**`client.rpushx(key, element[, element ...])`**

Insert all the specified values at the tail of the list stored at `key`, only if `key` already exists & holds a list.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `element` | String | **At least 1 required**, each element must be a string |

This method supports `WRITE` transactions.

### Using hashmaps

**`client.hget(key, field)`**

Returns the value associated with `field` in the hash stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `field` | String | **Required** |

This method supports `READ` transactions.

**`client.hgetall(key)`**

Returns all fields and values of the hash stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions.

**`client.hincrby(key, field, increment)`**

Increments the number stored at `field` in the hash stored at `key` by `increment`. If `key` does not exist, a new key holding a hash is created. If `field` does not exist the value is set to `0` before the operation is performed.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `field` | String | **Required** |
| `increment` | Number | **Required** |

This method supports `WRITE` transactions.

**`client.hkeys(key)`**

Returns all field names in the hash stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions.

**`client.hlen(key)`**

Returns the number of fields contained in the hash stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions.

**`client.hmget(key, field[, field ...])`**

Returns the values associated with the specified `fields` in the hash stored at `key`.

For every `field` that does not exist in the hash, a `null` value is returned. Because non-existing keys are treated as empty hashes, running `HMGET` against a non-existing key will return a list of `null` values.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `field` | String | **Required** |

This method supports `READ` transactions.

**`client.hset(key, field, value[, field, value, ... ...])`**

Sets `field` in the hash stored at `key` to `value`. If `key` does not exist, a new `key` holding a hash is created. If `field` already exists in the hash, it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `field` | String | **Required**, each field should be a string |
| `value` | String | **Required**, each value should be a string |

**`client.hset(key, object)`**

Sets each `key` `value` pair in the object into the hash stored at `key`. If `key` does not exist, a new `key` holding a hash is created. If `field` already exists in the hash, it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `object` | Object | **Required** |

**`client.hstrlen(key, field)`**

Returns the string length of the value associated with `field` in the hash stored at `key`. If the `key` or the `field` do not exist, `0` is returned.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `field` | String | **Required** |

This method supports `READ` transactions.

**`client.hvals(key)`**

Returns all field values in the hash stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions.

### Using sets

- Set members can be Strings / Numbers / Buffers, but you cannot mix types.

**`client.sadd(key, member[, member ...])`**

Add the specified members to the set stored at `key`. Specified members that are already a member of this set are ignored. If `key` does not exist, a new set is created before adding the specified members.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

This method supports `WRITE` transactions.

**`client.scard(key)`**

Returns the set cardinality (number of elements) of the set stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions.

**`client.sdiff(key[, key ...])`**

Returns the members of the set resulting from the difference between the first set and all the successive sets. Keys that do not exist are considered to be empty sets.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

**`client.sdiffstore(destination, key[, key ...])`**

Identical to `SDIFF`, but instead of returning the resulting set, it is stored in `destination`. If `destination` already exists, it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `destination` | String | **Required** |
| `key` | String | **Required** |

**`client.sinter(key[, key ...])`**

Returns the members of the set resulting from the intersection of all the given sets. Keys that do not exist are considered to be empty sets. With one of the keys being an empty set, the resulting set is also empty (since set intersection with an empty set always results in an empty set).

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

**`client.sinterstore(destination, key[, key ...])`**

Identical to `SINTER`, but instead of returning the resulting set, it is stored in `destination`. If `destination` already exists, it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `destination` | String | **Required** |
| `key` | String | **Required** |

**`client.sismember(key, member)`**

Returns `true` if `member` is a member of the set stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

This method supports `READ` transactions.

**`client.smismember(key, member[, member ...])`**

Returns whether each `member` is a member of the set stored at `key`. For every member, `true` is returned if the value is a member of the set, or `false` if the element is not a member of the set or if `key` does not exist.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

This method supports `READ` transactions.

**`client.srem(key, member[, member ...])`**

Remove the specified members from the set stored at `key`. Specified members that are not a member of this set are ignored.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

This method supports `WRITE` transactions.

**`client.sunion(key[, key ...])`**

Returns the members of the set resulting from the union of all the given sets. Keys that do not exist are considered to be empty sets.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

**`client.sunionstore(destination, key[, key ...])`**

Identical to `SUNION`, but instead of returning the resulting set, it is stored in `destination`. If `destination` already exists, it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `destination` | String | **Required** |
| `key` | String | **Required** |

### Other methods

- `PEXPIRE`, `PEXPIREAT`, `PTTL` are unsupported as DynamoDB doesn't support millisecond expiry.

**`client.copy(source, destination[, opts])`**

This command copies the value stored at the `source` key to the `destination` key. Copy the item to another DynamoDB table with `opts.destinationDb`. An error is thrown if destination already exists, unless `opts.replace` is set to `true`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `source` | String | **Required** |
| `destination` | String | **Required** |
| `opts.destinationDb` | String | Optionally copy to a different DynamoDB table |
| `opts.replace` | Boolean | Set to `true` to overwrite the contents of `destination` |

**`client.del(key[, key])`**

Removes the specified keys. A `key` is ignored if it does not exist.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `WRITE` transactions, however in transactions this method accepts a single key argument.

<!--**`client.dump(key)`**

Serialize the value stored at key in a specific format and return it to the user. The returned value can be synthesized back into a key using the `RESTORE` command.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |-->

**`client.exists(key[, key ...])`**

Returns if key exists. Specify multiple keys instead of a single one to return the total number of keys existing. If the same existing `key` is mentioned in the arguments multiple times, it will be counted multiple times. So if `somekey` exists, `exists('somekey', 'somekey')` will return `2`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions, however in transactions this method accepts a single key argument.

**`client.expire(key, seconds)`**

Set a timeout on `key`. After the timeout has expired, the key will automatically be deleted. A key with an associated timeout is often said to be "volatile".

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `seconds` | String | **Required**, number of seconds until the item expires |

This method supports `WRITE` transactions.

**`client.expireat(key, timestamp)`**

Set a timeout on `key`. After the timeout has expired, the key will automatically be deleted. A key with an associated timeout is often said to be "volatile".

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `timestamp` | Date | **Required**, a Date instance for when the item will expire |

This method supports `WRITE` transactions.

**`client.flushdb()`**

Delete all the keys in this database, iterating through keys with [DynamoDB's scan](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html) until no more remain.

**`client.move(key, db)`**

Move `key` from the currently database to the specified destination database. When `key` already exists in the destination `db`, or it does not exist in the source database, it does nothing.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `db` | String | **Required** |

**`client.persist(key)`**

Remove the existing timeout on `key`, turning the `key` from *volatile* (a key with an expire set) to *persistent* (a key that will never expire as no timeout is associated).

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `WRITE` transactions.

**`client.rename(key, newKey)`**

Renames `key` to `newkey`. It returns an error when `key` does not exist. If `newkey` already exists it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `newKey` | String | **Required** |

This method supports `WRITE` transactions.

**`client.renamenx(key, newKey)`**

Renames `key` to `newkey` if `newkey` does not yet exist. It returns an error when `key` does not exist.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `newKey` | String | **Required** |

This method supports `WRITE` transactions.

**`client.ttl(key)`**

Returns the remaining time to live of a `key` that has a timeout. This introspection capability allows a client to check how many seconds a given `key` will continue to be part of the dataset.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions.

**`client.type(key)`**

Returns the string representation of the type of the value stored at `key`. The different types that can be returned are: `string`, `list`, `set`, and `hash`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `READ` transactions.

### Transactions

```js
await redyn.transaction([
  client.transaction.set('users:1', JSON.stringify({ id: 1, name: 'Barry Allen' })),
  client.transaction.set('users:2', JSON.stringify({ id: 2, name: 'Iris West' })),
  client.transaction.set('users:3', JSON.stringify({ id: 3, name: 'Cisco Ramon' })),
  client.transaction.set('users:4', JSON.stringify({ id: 4, name: 'Caitlin Snow' })),
  client.transaction.set('users:5', JSON.stringify({ id: 5, name: 'Harrison Wells' })),
]);
```

DynamoDB supports transactions but with a few important limitations, which `redyn` passes onto the developer:

- You can only execute up to & including 25 items at a time.
- This doesn't support clients that are created with explicit `dynamodb` clients passed to it.
- You cannot mix reads & writes - you can read 25 items or write 25 items, but not a mix of both.

And importantly, not all methods support transactions. You'll notice in the methods documentation above a line stating whether the method supports `READ` or `WRITE` transactions - this means you can group a maximum of 25 `READ` methods together or a maximum of 25 `WRITE` methods together. Not all methods support transactions, this is usually because they already use transactions underneath. The most notable example of this is `HSET`!

## Development

- All major work should be in feature branches, include tests & finish with a PR into `master`.
- This README should is stored in Git, alongside code, therefore as code changes so should the documentation!
- This also means that documentation for older tags/versions is available at all times.
- To run tests, fire up [`amazon/dynamodb-local`](https://hub.docker.com/r/amazon/dynamodb-local):
  ```
  docker run --rm -d --name dynamodb -p 8000:8000 amazon/dynamodb-local
  ```
  - If you've not read through them, take note of [the differences](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html#DynamoDBLocal.Differences) between the production AWS DynamoDB platform & local Docker container.
