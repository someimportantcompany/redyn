---
title: Other Methods
nav_order: 8
---

# Other Methods
{: .no_toc }

- `PEXPIRE`, `PEXPIREAT`, `PTTL` are unsupported as DynamoDB doesn't support millisecond expiry.

1. TOC
{:toc}

## `client.copy(source, destination[, opts])`

This command copies the value stored at the `source` key to the `destination` key. Copy the item to another DynamoDB table with `opts.destinationDb`. An error is thrown if destination already exists, unless `opts.replace` is set to `true`. Returns a boolean to indicate the operation was successful.

Property | Type | Description
---- | ---- | ----
`source` | String | **Required**
`destination` | String | **Required**
`opts.destinationDb` | String | Optionally copy to a different DynamoDB table
`opts.replace` | Boolean | Set to `true` to overwrite the contents of `destination`

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.copy('example-src', 'example-dest');
console.log(result); // true
```

## `client.del(key[, key])`

Removes the specified keys. A `key` is ignored if it does not exist. Returns a boolean to indicate the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.del('example-key-1', 'example-key-2');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.del('example-key-1'),
  client.transaction.del('example-key-2'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions, however in transactions this method accepts a single key argument.

<!--## `client.dump(key)`

Serialize the value stored at key in a specific format and return it to the user. The returned value can be synthesized back into a key using the `RESTORE` command.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.dump('example-key');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.dump('example-key-1'),
  client.transaction.dump('example-key-2'),
]);
console.log(result); // [ true, true ]
```
-->

## `client.exists(key[, key ...])`

Returns if key exists. Specify multiple keys instead of a single one to return the total number of keys existing. If the same existing `key` is mentioned in the arguments multiple times, it will be counted multiple times. So if `somekey` exists, `exists('somekey', 'somekey')` will return `2`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.exists('example-key-1', 'example-key-2');
console.log(result); // 2

const result = await redyn.transaction([
  client.transaction.exists('example-key-1'),
  client.transaction.exists('example-key-2'),
]);
console.log(result); // [ 1, 1 ]
```

This method supports `READ` transactions, however in transactions this method accepts a single key argument.

## `client.expire(key, seconds)`

Set a timeout on `key`. After the timeout has expired, the key will automatically be deleted. A key with an associated timeout is often said to be "volatile". Returns a boolean to indicate the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`seconds` | String | **Required**, number of seconds until the item expires

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.expire('example-key-1', 86400); // 1d
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.expire('example-key-1', 3600), // 1h
  client.transaction.expire('example-key-2', 2 * 3600), // 2h
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

## `client.expireat(key, timestamp)`

Set a timeout on `key`. After the timeout has expired, the key will automatically be deleted. A key with an associated timeout is often said to be "volatile". Returns a boolean to indicate the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`timestamp` | Date | **Required**, a Date instance for when the item will expire

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const future = new Date('2099-01-01');

const result = await client.expireat('example-key-1', future);
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.expireat('example-key-1', future),
  client.transaction.expireat('example-key-2', 2 * future),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

## `client.flushdb()`

Delete all the keys in this database, iterating through keys with [DynamoDB's scan](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html) until no more remain.

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

await client.flushdb();
```

## `client.move(key, db)`

Move `key` from the currently database to the specified destination database. When `key` already exists in the destination `db`, or it does not exist in the source database, it does nothing.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`db` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

await client.move('example-key', 'redyn-example-table2');
```

## `client.persist(key)`

Remove the existing timeout on `key`, turning the `key` from *volatile* (a key with an expire set) to *persistent* (a key that will never expire as no timeout is associated). Returns a boolean to indicate the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.persist('example-key-1');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.persist('example-key-1'),
  client.transaction.persist('example-key-2'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

## `client.rename(key, newKey)`

Renames `key` to `newkey`. It returns an error when `key` does not exist. If `newkey` already exists it is overwritten.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`newKey` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.rename('example-key-1', 'example-key-2');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.rename('example-key-1', 'example-key-2'),
  client.transaction.rename('example-key-3', 'example-key-4'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

## `client.renamenx(key, newKey)`

Renames `key` to `newkey` if `newkey` does not yet exist. It returns an error when `key` does not exist.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`newKey` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.renamenx('example-key-1', 'example-key-2');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.renamenx('example-key-1', 'example-key-2'),
  client.transaction.renamenx('example-key-3', 'example-key-4'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

## `client.ttl(key)`

Returns the remaining time to live of a `key` that has a timeout. This introspection capability allows a client to check how many seconds a given `key` will continue to be part of the dataset. Returns the number of seconds until the key will expire, or `-1`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.ttl('example-key');
console.log(result); // 86399

const result = await redyn.transaction([
  client.transaction.ttl('example-key-1'),
  client.transaction.ttl('example-key-2'),
]);
console.log(result); // [ 3599, -1 ]
```

This method supports `READ` transactions.

## `client.type(key)`

Returns the string representation of the type of the value stored at `key`. The different types that can be returned are: `string`, `list`, `set`, and `hash`. Returns `null` if `key` doesn't exist.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.type('example-key');
console.log(result); // 'string'

const result = await redyn.transaction([
  client.transaction.type('example-hash'),
  client.transaction.type('example-set'),
]);
console.log(result); // [ 'hash', 'set' ]
```

This method supports `READ` transactions.

---

[Check out the Other Methods source on GitHub]({{site.gh_edit_repository}}/blob/master/commands/misc.js)
