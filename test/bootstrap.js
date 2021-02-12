require('dotenv/config');
require('module-alias/register');

(() => {
  const moduleAlias = require('module-alias');
  const path = require('path');

  moduleAlias.addAliases({
    redyn: path.resolve(__dirname, '../'),
    '@test': path.resolve(__dirname),
  });
})();

(() => {
  const redyn = require('redyn');
  const { dynamodb } = require('./utils');

  redyn.setDynamoDB(dynamodb);
})();
