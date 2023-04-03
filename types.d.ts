declare class Redyn {

  get(key: string, opts?: { consistentRead?: boolean }): Promise<string | null>
  set(key: string, value: string, opts?: { consistentRead?: boolean }): Promise<boolean>
  strlen(key: string, opts?: { consistentRead?: boolean }): Promise<number>
  incr(key: string): Promise<number>
  incrby(key: string, increment: number): Promise<number>
  decr(key: string): Promise<number>
  decrby(key: string, decrement: number): Promise<number>
  getdel(key: string): Promise<string | null>
  mget(...keys: string[]): Promise<(string | null)[]>
  mset(...pairs: string[]): Promise<boolean>
  mset(pairs: Record<string, string>): Promise<boolean>

}

declare const exports: {
  createClient(tableName: string): Redyn,
};

export default exports;
export { Redyn };
