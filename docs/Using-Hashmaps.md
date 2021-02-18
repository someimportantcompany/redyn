---
title: Using Hashmaps
nav_order: 5
---

# Using Hashmaps

## `client.hget(key, field)`

Returns the value associated with `field` in the hash stored at `key`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`field` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const username = await client.hget('example-hash', 'username');
console.log(username); // 'jdrydn'

const result = await redyn.transaction([
  client.transaction.hget('example-hash-1', 'username'),
  client.transaction.hget('example-hash-2', 'username'),
]);
console.log(result); // [ 'jdrydn', 'someimportantcompany' ]
```

This method supports `READ` transactions.

## `client.hgetall(key)`

Returns all fields and values of the hash stored at `key`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const username = await client.hget('example-hash', 'username');
console.log(username); // 'jdrydn'

const result = await redyn.transaction([
  client.transaction.hget('example-hash-1', 'username'),
  client.transaction.hget('example-hash-2', 'username'),
]);
console.log(result); // [ 'jdrydn', 'someimportantcompany' ]
```

This method supports `READ` transactions.

## `client.hincrby(key, field, increment)`

Increments the number stored at `field` in the hash stored at `key` by `increment`. If `key` does not exist, a new key holding a hash is created. If `field` does not exist the value is set to `0` before the operation is performed. Returns the value of `field` after the increment operation.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`field` | String | **Required**
`increment` | Number | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const counter = await client.hincrby('example-hash', 'counter', 1);
console.log(counter); // 3

const result = await redyn.transaction([
  client.transaction.hincrby('example-hash-1', 'counter', 2),
  client.transaction.hincrby('example-hash-2', 'counter', 1),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions, however returns a boolean indicating the operation was successful.

## `client.hkeys(key)`

Returns all field names in the hash stored at `key`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const keys = await client.hkeys('example-hash');
console.log(keys); // [ 'id', 'username', 'name' ]

const result = await redyn.transaction([
  client.transaction.hkeys('example-hash-1'),
  client.transaction.hkeys('example-hash-2'),
]);
console.log(result); // [ [ 'id', 'username', 'name' ], [ 'id', 'username' ] ]
```

This method supports `READ` transactions.

## `client.hlen(key)`

Returns the number of fields contained in the hash stored at `key`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const length = await client.hlen('example-hash');
console.log(length); // 3

const result = await redyn.transaction([
  client.transaction.hlen('example-hash-1'),
  client.transaction.hlen('example-hash-2'),
]);
console.log(result); // [ 3, 2 ]
```

This method supports `READ` transactions.

## `client.hmget(key, field[, field ...])`

Returns the values associated with the specified `fields` in the hash stored at `key`.

For every `field` that does not exist in the hash, a `null` value is returned. Because non-existing keys are treated as empty hashes, running `HMGET` against a non-existing key will return a list of `null` values.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`field` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const fields = await client.hmget('example-hash', 'id', 'username');
console.log(fields); // [ '1', 'jdrydn' ]

const result = await redyn.transaction([
  client.transaction.hmget('example-hash-1', 'id', 'username'),
  client.transaction.hmget('example-hash-2', 'id', 'username', 'name'),
]);
console.log(result); // [ [ '1', 'jdrydn' ], [ '2', 'someimportantcompany', null ] ]
```

This method supports `READ` transactions.

## `client.hset(key, field, value[, field, value, ... ...])`

Sets `field` in the hash stored at `key` to `value`. If `key` does not exist, a new `key` holding a hash is created. If `field` already exists in the hash, it is overwritten. Also allows an object of key-value pairs to be passed too. Returns a boolean to indicate the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`field` | String | **Required**, each field should be a string
`value` | String | **Required**, each value should be a string

> or

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`object` | Object | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

await client.hset('example-hash', 'id', '1');
await client.hset('example-hash', { username: 'jdrydn', name: 'James' });
```

This method isn't supported in-transactions.

## `client.hstrlen(key, field)`

Returns the string length of the value associated with `field` in the hash stored at `key`. If the `key` or the `field` do not exist, `0` is returned.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`field` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const fields = await client.hstrlen('example-hash', 'id', 'username');
console.log(fields); // [ '1', 'jdrydn' ]

const result = await redyn.transaction([
  client.transaction.hstrlen('example-hash-1', 'username'),
  client.transaction.hstrlen('example-hash-2', 'username'),
]);
console.log(result); // [ 6, 20 ]
```

This method supports `READ` transactions.

## `client.hvals(key)`

Returns all field values in the hash stored at `key`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const keys = await client.hvals('example-hash');
console.log(keys); // [ '1', 'jdrydn' ]

const result = await redyn.transaction([
  client.transaction.hvals('example-hash-1'),
  client.transaction.hvals('example-hash-2'),
]);
console.log(result); // [ [ '1', 'jdrydn' ], [ '2', 'someimportantcompany' ] ]
```

This method supports `READ` transactions.

---

[Check out the Hashmaps source on GitHub]({{site.gh_edit_repository}}/blob/master/commands/hashmaps.js)
