import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { pk, assert, isPlainObject } from '../utils';

export async function hmget(client: DynamoDBDocumentClient, tableName: string, key: string, ...fields: string[]) {
  assert(typeof key === 'string' && key.length, new TypeError('Expected key to be a string'));
  assert(Array.isArray(fields) && fields.length, new TypeError('Expected an array of fields'));
  fields.forEach((field) => {
    assert(typeof field === 'string' && field.length, new TypeError('Expected each field to be a string'));
  });

  const { expression, names } = fields.reduce(
    (r, field, i) => {
      r.expression.push(`#value.#field${i}`);
      r.names[`#field${i}`] = field;
      return r;
    },
    { expression: ['#pk'] as string[], names: {} as Record<string, string> },
  );

  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk: key },
      ProjectionExpression: expression.join(', '),
      ExpressionAttributeNames: { '#pk': 'pk', '#value': 'value', ...names },
    }),
  );

  const { value } = isPlainObject(result?.Item) ? result.Item : {};
  return isPlainObject(value) ? fields.map((field) => value[field] ?? null) : fields.map(() => null);
}
