---
layout: default
title: Home
nav_order: 1
---

Promise-first [Redis](https://redis.io)-implementation for [NodeJS](https://nodejs.org) backed by [DynamoDB](https://aws.amazon.com/dynamodb).
{: .fs-6 .fw-300 }

[![NPM](https://badge.fury.io/js/redyn.svg)](https://npm.im/redyn)
[![CI](https://github.com/someimportantcompany/redyn/workflows/Test/badge.svg?branch=master)](https://github.com/someimportantcompany/redyn/actions?query=branch%3Amaster)
[![Coverage](https://coveralls.io/repos/github/someimportantcompany/redyn/badge.svg)](https://coveralls.io/github/someimportantcompany/redyn)

This library is designed to use DynamoDB as a simple cache store - using a combination of DynamoDB patterns & expressions to store data in a similar pattern to Redis.

```js
const redyn = require('redyn');
// Or
import redyn from 'redyn';

// Specify your DynamoDB table
const client = redyn.createClient('redyn-example-table');
// Start executing Redis commands!


// Strings

await client.set('users:1', JSON.stringify({ id: 1, name: 'Barry Allen' }));
await client.set('users:2', JSON.stringify({ id: 2, name: 'Iris West' }));
await client.set('users:3', JSON.stringify({ id: 3, name: 'Cisco Ramon' }));
await client.set('users:4', JSON.stringify({ id: 4, name: 'Caitlin Snow' }));
await client.set('users:5', JSON.stringify({ id: 5, name: 'Harrison Wells' }));

const user = await client.get('users:1');
console.log(JSON.parse(user));
// { id: 1,
//   name: 'Barry Allen' }


// Lists

await client.rpush('users', 1, 2, 3, 3, 4, 4, 5);
await client.lpush('users', 0);

const userIDs = await client.lrange('users', 0, -1);
console.log(JSON.parse(userIDs));
// [ 0, 1, 2, 3, 3, 4, 4, 5 ]


// Sets

await client.sadd('users:unique', 1, 2, 3, 3, 4, 4, 5);

const uniqueUserIDs = await client.smembers('users:unique');
console.log(JSON.parse(uniqueUserIDs));
// [ 1, 2, 3, 4, 5 ]
```

---

Any questions or suggestions please [open an issue](https://github.com/someimportantcompany/redyn/issues).
