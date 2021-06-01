/* eslint-disable global-require */
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, './.env') });

const moduleAlias = require('module-alias');
moduleAlias.addAliases({
  '@test': __dirname,
});

const redyn = require('redyn');
const { dynamodb } = require('./utils');
redyn.setDynamoDB(dynamodb);
