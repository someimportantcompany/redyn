export function rename(): never {
  throw new Error('rename cannot be expressed as a single transaction item');
}
