---
layout: default
title: Using Lists
nav_order: 4
---

# Using Lists
{: .no_toc }

1. TOC
{:toc}

## `client.rpush(key, element[, element ...])`

Insert all the specified values at the tail of the list stored at `key`. If `key` does not exist, it is created as empty list before performing the push operation. When `key` holds a value that is not a list, an error is returned. Returns the length of list after the push operation.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`element` | String | **At least 1 required**, each element must be a string

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const length = await client.rpush('example-list', 'value1', 'value2');
console.log(length); // 2

const result = await redyn.transaction([
  client.transaction.rpush('example-list-1', 'value1', 'value2'),
  client.transaction.rpush('example-list-2', 'value3', 'value4'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions, however in transactions returns a boolean indicating the operation was successful.

## `client.rpushx(key, element[, element ...])`

Insert all the specified values at the tail of the list stored at `key`, only if `key` already exists & holds a list. Returns the length of list after the push operation, or `false` if a list is not present at `key`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`element` | String | **At least 1 required**, each element must be a string

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const length = await client.rpushx('example-list', 'value1', 'value2');
console.log(length); // 2

const result = await redyn.transaction([
  client.transaction.rpushx('example-list-1', 'value1', 'value2'),
  client.transaction.rpushx('example-list-2', 'value3', 'value4'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions, however in transactions returns a boolean indicating the operation was successful.

## `client.lpush(key, element[, element ...])`

Insert all the specified values at the head of the list stored at `key`. If `key` does not exist, it is created as empty list before performing the push operation. When `key` holds a value that is not a list, an error is returned. Returns the length of list after the push operation.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`element` | String | **At least 1 required**, each element must be a string

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const length = await client.lpush('example-list', 'value1', 'value2');
console.log(length); // 2

const result = await redyn.transaction([
  client.transaction.lpush('example-list-1', 'value1', 'value2'),
  client.transaction.lpush('example-list-2', 'value3', 'value4'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions, however in transactions returns a boolean indicating the operation was successful.

## `client.lpushx(key, element[, element ...])`

Insert all the specified values at the head of the list stored at `key`, only if `key` already exists & holds a list. Returns the length of list after the push operation, or `false` if a list is not present at `key`.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`element` | String | **At least 1 required**, each element must be a string

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const length = await client.lpushx('example-list', 'value1', 'value2');
console.log(length); // 2

const result = await redyn.transaction([
  client.transaction.lpushx('example-list-1', 'value1', 'value2'),
  client.transaction.lpushx('example-list-2', 'value3', 'value4'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions, however in transactions returns a boolean indicating the operation was successful.

## `client.lindex(key, index)`

Returns the element at index index in the list stored at key. The index is zero-based, so 0 means the first element, 1 the second element and so on.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`index` | Number | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const value = await client.lindex('example-list', 0);
console.log(value); // 'example-value'

const result = await redyn.transaction([
  client.transaction.lindex('example-list-1', 1),
  client.transaction.lindex('example-list-2', 0),
]);
console.log(result); // [ 'value2', 'value' ]
```

This method supports `READ` transactions.

## `client.llen(key, index)`

Returns the length of the list stored at key. If key does not exist, it is interpreted as an empty list and 0 is returned. An error is returned when the value stored at key is not a list.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const length = await client.llen('example-list');
console.log(length); // 2

const result = await redyn.transaction([
  client.transaction.llen('example-list-1'),
  client.transaction.llen('example-list-2'),
  client.transaction.llen('example-list-3'),
]);
console.log(result); // [ 3, 1, 0 ]
```

This method supports `READ` transactions.

## `client.lrange(key, start, stop)`

Returns the specified elements of the list stored at `key`. The offsets `start` and `stop` are zero-based indexes, with 0 being the first element of the list (the head of the list), 1 being the next element and so on.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`start` | Number | **Required**
`stop` | Number | **Required**

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const values = await client.lrange('example-list', 0, -1);
console.log(values); // [ 'a', 'b', 'c', 'd', 'e' ]

const values = await client.lrange('example-list', 0, 2);
console.log(values); // [ 'a', 'b' ]

const result = await redyn.transaction([
  client.transaction.lrange('example-list-1', 0, 1),
  client.transaction.lrange('example-list-2', 0, -1),
  client.transaction.lrange('example-list-3', 0, -1),
]);
console.log(result); // [ [ 'a', 'b' ], [ '1', '2', '3' ], [] ]
```

This method supports `READ` transactions.

## `client.lset(key, index, element)`

Sets the list element at `index` to `element`. Returns a boolean to indicate the operation was successful.

Property | Type | Description
---- | ---- | ----
`key` | String | **Required**
`index` | Number | **Required**
`element` | String | **At least 1 required**, each element must be a string

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.lset('example-list', 0, 'a1');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.lset('example-list-1', 1, 'value'),
  client.transaction.lset('example-list-2', 0, 'value'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

---

[Check out the Lists source on GitHub]({{site.gh_edit_repository}}/blob/master/commands/lists.js)
