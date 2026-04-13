import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import RedynClient from './client';
import { assert } from './utils';

export function createRedynClient(
  tableName: string,
  opts?: {
    documentClient?: DynamoDBDocumentClient;
  },
) {
  assert(typeof tableName === 'string' && tableName.length, new TypeError('Expected tableName to be a string'));

  const documentClient = opts?.documentClient ?? DynamoDBDocumentClient.from(new DynamoDB());
  assert(
    documentClient instanceof DynamoDBDocumentClient,
    new TypeError('Expected documentClient to be a DynamoDBDocumentClient'),
  );

  return new RedynClient(documentClient, tableName);
}
