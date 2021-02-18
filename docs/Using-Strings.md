---
title: Using Strings
nav_order: 3
---

# Using Strings
{: .no_toc }

1. TOC
{:toc}

## `client.decr(key)`

Decrements the number stored at `key` by one. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `WRITE` transactions.

## `client.decrby(key, decrement)`

Decrements the number stored at `key` by `decrement`. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `decrement` | Number | **Required** |

This method supports `WRITE` transactions.

## `client.get(key[, opts])`

Get the value of key. If the key does not exist then `null` is returned. An error is returned if the value stored at key is not a string, because `GET` only handles string values.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `opts.consistentRead` | Boolean | Optionally enforce consistent reads, ignored in [transactions](#transactions) |

This method supports `READ` transactions.

## `client.incr(key)`

Increments the number stored at `key` by one. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |

This method supports `WRITE` transactions.

## `client.incrby(key, increment)`

Increments the number stored at `key` by `increment`. If the key does not exist, it is set to `0` before performing the operation.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
| `increment` | Number | **Required** |

This method supports `WRITE` transactions.

## `client.mget(key[, key ...])`

Returns the values of all specified keys. For every key that does not hold a string value or does not exist, `null` is returned. Because of this, the operation never fails.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** Each argument is a string representing the specific key |

## `client.mset(key, value[, key, value ... ...])`

Sets the given keys to their respective values. `MSET` replaces existing values with new values, just as regular `SET`.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** Each key argument is a string |
| `value` | String | **Required** Each value argument is a string |

## `client.set(key, value[, opts])`

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

## `client.strlen(key)`

Returns the length of the string value stored at `key`, or `0` when `key` does not exist. An error is returned when key holds a non-string value.

| Property | Type | Description |
| ---- | ---- | ---- |
| `key` | String | **Required** |
