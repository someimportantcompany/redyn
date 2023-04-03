---
layout: default
title: Using Strings
nav_order: 3
---

# Using Strings
{: .no_toc }

1. TOC
{:toc}

## `client.get(key[, opts])`

Get the value of key. If the key does not exist then `null` is returned. An error is returned if the value stored at key is not a string, because `GET` only handles string values.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`opts.consistentRead` | Boolean | Optionally enforce consistent reads, ignored in [transactions](./Transactions.html)

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const value = await client.get('example-key');
console.log(value); // 'example-value'

const [ value1, value2 ] = await redyn.transaction([
  client.transaction.get('example-key-1'),
  client.transaction.get('example-key-2'),
]);
console.log(value1); // 'example-value-1'
console.log(value2); // 'example-value-2'
```

This method supports `READ` transactions.

## `client.set(key, value[, opts])`

Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type. Any previous time to live associated with the key is discarded on successful `SET` operation. Returns a boolean indicating the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`value` | String | **Required**
`opts.ex` | Number | Optionally set the spcified expire time, in seconds
`opts.exat` | Number | Optionally set the specified UNIX time at which the key will expire, in seconds
`opts.nx` | Boolean | Only set if the key does not already exist
`opts.xx` | Boolean | Only set if the key already exists

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const value = await client.set('example-key', 'example-value');
console.log(value); // true

const result = await redyn.transaction([
  client.transaction.set('example-key-1', 'example-value-1'),
  client.transaction.set('example-key-2', 'example-value-2'),
]);
console.log(result); // [ true, true ]
```

- `PX` & `PXAT` is unsupported as DynamoDB's TTL feature does not support milliseconds.

This method supports `WRITE` transactions.

## `client.strlen(key)`

Returns the length of the string value stored at `key`, or `0` when `key` does not exist. An error is returned when key holds a non-string value.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`opts.consistentRead` | Boolean | Optionally enforce consistent reads, ignored in [transactions](./Transactions.html)

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const value = await client.strlen('example-key');
console.log(value); // 'example-value' => 13

const result = await redyn.transaction([
  client.transaction.strlen('example-key-1'), // 'example-value-1'
  client.transaction.strlen('example-key-2'), // 'example-value-2'
  client.transaction.strlen('example-key-3'), // null
]);
console.log(result); // [ 15, 15, 0 ]
```

This method supports `READ` transactions.

## `client.incr(key)`

Increments the number stored at `key` by one. If the key does not exist, it is set to `0` before performing the operation. Returns the value of `key` after the increment.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.incr('example-counter');
console.log(count); // 1

const result = await redyn.transaction([
  client.transaction.incr('example-counter-1'), // 1
  client.transaction.incr('example-counter-2'), // null
]);
console.log(result); // [ 2, 1 ]
```

This method supports `WRITE` transactions, however in transactions this method returns a boolean instead of the value post-increment.

## `client.incrby(key, increment)`

Increments the number stored at `key` by `increment`. If the key does not exist, it is set to `0` before performing the operation. Returns the value of `key` after the increment.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`increment` | Number | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.incrby('example-counter', 2);
console.log(count); // 5

const result = await redyn.transaction([
  client.transaction.incrby('example-counter-1', 3), // 1
  client.transaction.incrby('example-counter-2', 3), // null
]);
console.log(result); // [ 4, 3 ]
```

This method supports `WRITE` transactions, however in transactions this method returns a boolean instead of the value post-increment.

## `client.decr(key)`

Decrements the number stored at `key` by one. If the key does not exist, it is set to `0` before performing the operation. Returns the value of `key` after the decrement.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.decr('example-counter');
console.log(count); // -1

const result = await redyn.transaction([
  client.transaction.decr('example-counter-1'), // 1
  client.transaction.decr('example-counter-2'), // null
]);
console.log(result); // [ 0, -1 ]
```

This method supports `WRITE` transactions, however in transactions this method returns a boolean instead of the value post-decrement.

## `client.decrby(key, decrement)`

Decrements the number stored at `key` by `decrement`. If the key does not exist, it is set to `0` before performing the operation. Returns the value of `key` after the decrement.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`decrement` | Number | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.decrby('example-counter', 2);
console.log(count); // 3

const result = await redyn.transaction([
  client.transaction.decrby('example-counter-1', 3), // 5
  client.transaction.decrby('example-counter-2', 3), // null
]);
console.log(result); // [ 2, -3 ]
```

This method supports `WRITE` transactions, however in transactions this method returns a boolean instead of the value post-decrement.

## `client.getdel(key)`

Get the value of `key` and delete `key`. This command is similar to `GET`, except for the fact that it also deletes the key on success (if and only if the key's value type is a string). Returns the value of `key` or `null` if `key` does not exist.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required** Each argument is a string representing the specific key

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const value = await client.getdel('example-key');
console.log(value); // 'example-value'

const value = await client.get('example-key');
console.log(value); // null
```

## `client.mget(key[, key ...])`

Returns the values of all specified keys. For every key that does not hold a string value or does not exist, `null` is returned. Because of this, the operation never fails.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required** Each argument is a string representing the specific key

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.mget('example-key-1', 'example-key-2', 'example-key-3');
console.log(result); // [ 'example-value-1', 'example-value-2', null ]
```

## `client.mset(key, value[, key, value ... ...])`

Sets the given keys to their respective values. `MSET` replaces existing values with new values, just as regular `SET`. This method also supports passing an object of key-value items, instead of pairs of arguments. Returns a boolean indicating the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required** Each key argument is a string
`value` | String | **Required** Each value argument is a string

> or

Property | Type | Description
---- | ---- | ----
`pairs` | Object | **Required** Each key in this object should be a string

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.mset('example-key-1', 'example-value-1', 'example-key-2', 'example-value-2');
console.log(result); // true

const result = await client.mset({
  'example-key-1': 'example-value-1',
  'example-key-2': 'example-value-2',
  'example-key-3': 'example-value-3',
});
console.log(result); // true
```

---

[Check out the Strings source on GitHub]({{site.gh_edit_repository}}/blob/master/commands/strings.js)
