<div align="center" style="margin-bottom: 50px">
  <h1>redyn</h1>
  <a href="https://npm.im/redyn"><img alt="NPM" src="https://badge.fury.io/js/redyn.svg"/></a>
  <a href="https://github.com/jdrydn/redyn/actions?query=branch%3Amaster"><img alt="CI" src="https://github.com/jdrydn/redyn/workflows/Test/badge.svg?branch=master"/></a>
  <!-- <a href="https://coveralls.io/github/jdrydn/redyn?branch=master"><img alt="Coverage" src="https://coveralls.io/repos/github/jdrydn/redyn/badge.svg?branch=master"/></a> -->
  <a href="./docs/"><img alt="Docs" src="https://img.shields.io/static/v1?label=Read&message=Documentation&color=blue&logo=read-the-docs"/></a>
</div>

[Promise](https://onezero.medium.com/mewe-sold-itself-on-privacy-then-the-radical-right-arrived-e527b38e4718)-first [Redis](https://redis.io)-implementation for [NodeJS](https://nodejs.org) backed by [DynamoDB](https://aws.amazon.com/dynamodb).

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
- [Using zsets](#using-zsets)
- [Other methods](#other-methods)
- [Transactions](#transaction)

### Getting Started

Import or require redyn into your project:

```js
const redyn = require('redyn');
// or
import redyn from 'redyn';
```

#### Configure

| Exported | Description |
| ---- | ---- |
| `redyn.createClient(config)` | The main function used to create a client. |
| `redyn.setDynamoDB(client)` | A function to set the DynamoDB instance used in future `createClient` calls, see [Set DynamoDB](#set-dynamodb) below. |

#### Create a client

The `createClient` method is the starting point for all clients: It is a synchronous method that builds a client from the provided configuration object that defines which table will be used:

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-cache');
```

You must ensure your table has already been created following this [`createTable`](./createTable.json) specification.

#### Set DynamoDB

_redyn_ interacts with the AWS-SDK, by default it creates a new `AWS.DynamoDB` instance when you create a model. Check out AWS's "[Setting credentials in Node.js](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html)" documentation for more details. Since underneath DynamoDB is a handful of HTTPS calls, you can theoretically create as many instances as you like.

Alternatively you can pass a preconfigured `dynamodb` instance to save on resources:

```js
const AWS = require('aws-sdk');
const redyn = require('redyn');

// Perhaps the table for this model exists in another AWS region:
const dynamodb = new AWS.DynamoDB({ region: 'eu-west-2' });
const entries = redyn.createModel({
  tableName: 'redyn-example-cache',
  dynamodb,
});

// Or perhaps you want to test your model against a local DynamoDB instance (such as dynamodb-local or localstack):
const dynamodb = new AWS.DynamoDB({ endpoint: 'http://localhost:8000' });
const entries = redyn.createModel({
  tableName: 'redyn-example-cache',
  dynamodb,
});
```

Or you can set a `dynamodb` instance for **all future** `createModel` calls:

```js
const dynamodb = new AWS.DynamoDB({ endpoint: 'http://localhost:8000' });
redyn.setDynamoDB(dynamodb);

// And this will use the dynamodb instance specified
const entries = redyn.createModel('redyn-example-cache');
// This is mostly useful for tests, so you can point your models to your local DynamoDB instance
// without littering your codebase with if-tests-then statements!
```

### Using strings

- SETPX & SET PX are unsupported as DynamoDB doesn't support millisecond TTL.

### Using lists

### Using hashmaps

### Using sets

### Using zsets

### Other methods

- PEXPIRE, PEXPIREAT, PTTL are unsupported as DynamoDB doesn't support millisecond TTL.

### Transactions

- HSET is unsupported in transaction

## Development

- All major work should be in feature branches, include tests & finish with a PR into `master`.
- This README should is stored in Git, alongside code, therefore as code changes so should the documentation!
- This also means that documentation for older tags/versions is available at all times.
- To run tests, fire up [`amazon/dynamodb-local`](https://hub.docker.com/r/amazon/dynamodb-local):
  ```
  docker run --rm -d --name dynamodb -p 8000:8000 amazon/dynamodb-local
  ```
  - If you've not read through them, take note of [the differences](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html#DynamoDBLocal.Differences) between the production AWS DynamoDB platform & local Docker container.
