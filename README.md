# redyn

[![NPM](https://badge.fury.io/js/redyn.svg)](https://npm.im/redyn)
[![CI](https://github.com/someimportantcompany/redyn/workflows/Test/badge.svg?branch=master)](https://github.com/someimportantcompany/redyn/actions?query=branch%3Amaster)

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

- [Getting Started](https://someimportantcompany.com/redyn/Getting-Started.html)
- [Using Strings](https://someimportantcompany.com/redyn/Using-Strings.html)
- [Using Lists](https://someimportantcompany.com/redyn/Using-Lists.html)
- [Using Hashmaps](https://someimportantcompany.com/redyn/Using-Hashmaps.html)
- [Using Sets](https://someimportantcompany.com/redyn/Using-Sets.html)
- [Transactions](https://someimportantcompany.com/redyn/Transactions.html)
- [Other Methods](https://someimportantcompany.com/redyn/Other-Methods.html)

## Development

- All major work should be in feature branches, include tests & finish with a PR into `master`.
- This README should is stored in Git, alongside code, therefore as code changes so should the documentation!
- This also means that documentation for older tags/versions is available at all times.
- To run tests, fire up [`amazon/dynamodb-local`](https://hub.docker.com/r/amazon/dynamodb-local):
  ```
  docker run --rm -d --name dynamodb -p 8000:8000 amazon/dynamodb-local
  ```
  - If you've not read through them, take note of [the differences](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html#DynamoDBLocal.Differences) between the production AWS DynamoDB platform & local Docker container.
