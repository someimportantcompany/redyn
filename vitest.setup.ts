import assert from 'assert';
import ms from 'ms';
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { URL } from 'url';

const startedAt = Date.now();
let container: StartedTestContainer | null = null;

export async function setup() {
  const { DYNAMODB_ENDPOINT, DYNAMODB_TABLE } = process.env;
  assert(DYNAMODB_ENDPOINT, 'Missing { DYNAMODB_ENDPOINT } env');
  assert(DYNAMODB_TABLE, 'Missing { DYNAMODB_TABLE } env');

  if (process.env.REDYN_TEST_USE_TESTCONTAINERS === 'yes') {
    console.log(
      '[DynamoDB][Local] Starting DynamoDB container (amazon/dynamodb-local) (%s) (%s)',
      DYNAMODB_ENDPOINT,
      ms(Date.now() - startedAt),
    );

    const portNum = parseInt(new URL(process.env.DYNAMODB_ENDPOINT).port, 10);
    assert(!isNaN(portNum), 'Expected { DYNAMODB_ENDPOINT } env to have a port number');

    container = await new GenericContainer('amazon/dynamodb-local:3.0.0')
      .withExposedPorts({ container: 8000, host: portNum, protocol: 'tcp' })
      .start();

    assert(container, 'Container not started properly');
    console.log('[DynamoDB][Local] Ready! (%s)', ms(Date.now() - startedAt));
  }

  const dydb = new DynamoDBClient({ endpoint: DYNAMODB_ENDPOINT });

  try {
    await dydb.send(new DeleteTableCommand({ TableName: DYNAMODB_TABLE }));
    console.log(
      '[DynamoDB] Deleted table: %s (%s) (%s)',
      DYNAMODB_TABLE,
      DYNAMODB_ENDPOINT ?? 'AWS',
      ms(Date.now() - startedAt),
    );
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') {
      throw err;
    }
  }

  /**
   * Keep the CreateTable structure in sync with ../terraform/dynamodb.tf#aws_dynamodb_table
   */
  await dydb.send(
    new CreateTableCommand({
      TableName: DYNAMODB_TABLE,
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  );

  console.log(
    '[DynamoDB] Created table: %s (%s) (%s)',
    DYNAMODB_TABLE,
    DYNAMODB_ENDPOINT ?? 'AWS',
    ms(Date.now() - startedAt),
  );

  process.stdout.write('\n');
}

export async function teardown() {
  if (container) {
    process.stdout.write('\n');
    console.log('[DynamoDB][Local] Stopping DynamoDB container (%s)', ms(Date.now() - startedAt));
    await container.stop();
    container = null;
    console.log('[DynamoDB][Local] Stopped! (%s)', ms(Date.now() - startedAt));
  }
}
