---
title: Using Sets
nav_order: 6
---

# Using Sets
{: .no_toc }

- Set members can be Strings / Numbers / Buffers, but you cannot mix types.

1. TOC
{:toc}

## `client.sadd(key, member[, member ...])`

Add the specified members to the set stored at `key`. Specified members that are already a member of this set are ignored. If `key` does not exist, a new set is created before adding the specified members. Returns a boolean to indicate the operation was successful.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.sadd('example-set', 'a', 'b', 'c', 'c', 'd');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.sadd('example-set-1', 'a', 'b', 'c'),
  client.transaction.sadd('example-set-2', 'd', 'e', 'f'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

## `client.scard(key)`

Returns the set cardinality (number of elements) of the set stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.scard('example-set');
console.log(count); // 4

const result = await redyn.transaction([
  client.transaction.scard('example-set-1'),
  client.transaction.scard('example-set-2'),
]);
console.log(result); // [ 3, 2 ]
```

This method supports `READ` transactions.

## `client.sdiff(key[, key ...])`

Returns the members of the set resulting from the difference between the first set and all the successive sets. Keys that do not exist are considered to be empty sets.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const diff = await client.sdiff('example-set-1', 'example-set-2');
console.log(diff); // [ 'b', 'c', 'f' ]
```

## `client.sdiffstore(destination, key[, key ...])`

Identical to `SDIFF`, but instead of returning the resulting set, it is stored in `destination`. If `destination` already exists, it is overwritten. Returns the number of items in the new set.

| Property | Type | Description |
| ---- | ---- | ---- |
| `destination` | String | **Required** |
| `key` | String | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.sdiffstore('example-set-diff', 'example-set-1', 'example-set-2');
console.log(count); // 3
```

## `client.sinter(key[, key ...])`

Returns the members of the set resulting from the intersection of all the given sets. Keys that do not exist are considered to be empty sets. With one of the keys being an empty set, the resulting set is also empty (since set intersection with an empty set always results in an empty set).

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const inter = await client.sinter('example-set-1', 'example-set-2');
console.log(inter); // [ 'a' ]
```

## `client.sinterstore(destination, key[, key ...])`

Identical to `SINTER`, but instead of returning the resulting set, it is stored in `destination`. If `destination` already exists, it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `destination` | String | **Required** |
| `key` | String | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.sinterstore('example-set-inter', 'example-set-1', 'example-set-2');
console.log(count); // 1
```

## `client.sismember(key, member)`

Returns `true` if `member` is a member of the set stored at `key`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.sismember('example-set', 'b');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.sismember('example-set-1', 'b'),
  client.transaction.sismember('example-set-2', 'c'),
]);
console.log(result); // [ true, false ]
```

This method supports `READ` transactions.

## `client.smismember(key, member[, member ...])`

Returns whether each `member` is a member of the set stored at `key`. For every member, `true` is returned if the value is a member of the set, or `false` if the element is not a member of the set or if `key` does not exist.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.sismember('example-set', 'b');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.sismember('example-set-1', 'b'),
  client.transaction.sismember('example-set-2', 'c'),
]);
console.log(result); // [ true, false ]
```

This method supports `READ` transactions.

## `client.srem(key, member[, member ...])`

Remove the specified members from the set stored at `key`. Specified members that are not a member of this set are ignored. Returns a boolean to indicate the operation was successful.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `member` | String / Number / Buffer | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const result = await client.srem('example-set', 'b');
console.log(result); // true

const result = await redyn.transaction([
  client.transaction.srem('example-set-1', 'b'),
  client.transaction.srem('example-set-2', 'c'),
]);
console.log(result); // [ true, true ]
```

This method supports `WRITE` transactions.

## `client.sunion(key[, key ...])`

Returns the members of the set resulting from the union of all the given sets. Keys that do not exist are considered to be empty sets.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const union = await client.sunion('example-set-1', 'example-set-2');
console.log(union); // [ 'a', 'b', 'c' ]
```

## `client.sunionstore(destination, key[, key ...])`

Identical to `SUNION`, but instead of returning the resulting set, it is stored in `destination`. If `destination` already exists, it is overwritten.

| Property | Type | Description |
| ---- | ---- | ---- |
| `destination` | String | **Required** |
| `key` | String | **Required** |

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-table');

const count = await client.sunionstore('example-set-union', 'example-set-1', 'example-set-2');
console.log(count); // 2
```

---

[Check out the Sets source on GitHub]({{site.gh_edit_repository}}/blob/master/commands/sets.js)
