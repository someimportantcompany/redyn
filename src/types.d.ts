import type {
  TransactGetCommandInput,
  TransactGetCommandOutput,
  TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';

type TransactGetItem = NonNullable<NonNullable<TransactGetCommandInput['TransactItems']>[number]>;
type TransactWriteItem = NonNullable<NonNullable<TransactWriteCommandInput['TransactItems']>[number]>;

export interface TransactionGetHandler {
  (input: TransactGetItem): Promise<Record<string, unknown> | undefined>;
}

export interface TransactionWriteHandler {
  (input: TransactWriteItem): Promise<void>;
}
