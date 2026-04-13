export const pk = 'redyn' as const;

export function assert(value: unknown, err: Error, opts?: Record<string, unknown>): asserts value {
  if (!value) {
    if (typeof err === 'string') {
      err = new Error(err);
      if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(err, assert);
      }
    }

    if (opts) {
      Object.assign(err, opts);
    }

    throw err;
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function getSetType(member: unknown): 'SS' | 'NS' | 'BS' {
  if (member instanceof Buffer) {
    return 'BS';
  } else if (typeof member === 'number') {
    return 'NS';
  } else if (typeof member === 'string') {
    return 'SS';
  } else {
    throw new TypeError('Set members must be a string, number or Buffer');
  }
}
