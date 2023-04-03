---
layout: default
name: Getting Started
nav_order: 2
---

# Getting Started
{: .no_toc }

Install through your preferred package manager:

```
npm install --save redyn
# or
yarn install redyn
```

Then import/require redyn into your project:

```js
const redyn = require('redyn');
// or
import redyn from 'redyn';
```

1. TOC
{:toc}

## Configure

| Exported | Description |
| ---- | ---- |
| `redyn.createClient(config)` | The main function used to create a client. |
| `redyn.setDynamoDB(client)` | A function to set the DynamoDB instance used in future `createClient` calls, see [Set DynamoDB](#set-dynamodb) below. |

## Create a client

The `createClient` method is your starting point: It is a synchronous method that builds a client from the provided configuration object that defines which table will be used:

```js
const redyn = require('redyn');
const client = redyn.createClient('redyn-example-cache');
```

You must ensure your table has already been created following this [`createTable`](https://github.com/someimportantcompany/redyn/blob/master/createTable.json) specification:

```json
{
  "TableName": "redyn-example-table",
  "BillingMode": "PAY_PER_REQUEST",
  "KeySchema": [
    { "AttributeName": "key", "KeyType": "HASH" }
  ],
  "AttributeDefinitions": [
    { "AttributeName": "key", "AttributeType": "S" }
  ],
  "TimeToLiveSpecification": {
    "AttributeName": "ttl",
    "Enabled": true
  }
}
```

## Set DynamoDB

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
