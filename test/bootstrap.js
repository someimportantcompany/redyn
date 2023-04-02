/* eslint-disable global-require */
Object.assign(process.env, {
  AWS_ACCESS_KEY_ID: 'some-important-access-key',
  AWS_SECRET_ACCESS_KEY: 'some-important-secret-key',
  AWS_REGION: 'us-east-1',
  AWS_DYNAMODB_ENDPOINT: 'http://localhost:8000',
});

const moduleAlias = require('module-alias');
moduleAlias.addAliases({ '@test': __dirname });

const redyn = require('redyn');
const { dynamodb } = require('@test/utils');
redyn.setDynamoDB(dynamodb);
