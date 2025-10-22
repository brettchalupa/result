/**
 * @brettchalupa/result
 *
 * @module
 *
 * A generic Result type that represents either success or failure, inspired by Rust's Result<T, E>
 * and functional programming patterns. This eliminates the need for throwing exceptions for
 * expected error conditions and makes error handling explicit.
 *
 * The Result pattern provides type-safe error handling by making errors part of the function's
 * return type rather than relying on exceptions. This approach offers several benefits:
 * - **Explicit error handling**: Errors must be handled or explicitly ignored
 * - **Type safety**: Both success and error types are checked at compile time
 * - **Composability**: Results can be easily chained and transformed
 * - **Performance**: No exception overhead for expected error conditions
 *
 * @example Basic usage
 * ```typescript
 * import { ok, err, type Result } from "@scope/result";
 *
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return err("Cannot divide by zero");
 *   }
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.isOk()) {
 *   console.log('Result:', result.data); // Result: 5
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 *
 * @example Async operations
 * ```typescript
 * import { ok, err, type Result } from "@scope/result";
 *
 * async function findUser(id: string): Promise<Result<User, DatabaseError>> {
 *   try {
 *     const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
 *     if (!user) {
 *       return err({ code: 'NOT_FOUND', message: 'User not found' });
 *     }
 *     return ok(user);
 *   } catch (error) {
 *     return err({ code: 'CONNECTION_ERROR', message: String(error) });
 *   }
 * }
 * ```
 *
 * @example Chaining operations
 * ```typescript
 * import { ok, err } from "@scope/result";
 *
 * // Method chaining on Result instances
 * const result = ok({ name: "Alice", age: 30 })
 *   .map(user => user.name)
 *   .map(name => name.toUpperCase()); // ok("ALICE")
 * ```
 *
 * @example Using utility functions
 * ```typescript
 * import { Result } from "@scope/result";
 *
 * // Safely parse JSON
 * const parsed = Result.try(() => JSON.parse('{"valid": "json"}'));
 *
 * // Combine multiple results
 * const results = Result.all([ok(1), ok(2), ok(3)]); // ok([1, 2, 3])
 * ```
 */

/**
 * Represents a successful result containing data of type T
 */
export type Ok<T> = {
  readonly success: true;
  readonly data: T;
  readonly error: null;
  isOk(): this is Ok<T>;
  isErr(): this is never;
  map<U>(fn: (data: T) => U): Result<U, never>;
  mapErr<F>(_fn: (error: never) => F): Result<T, F>;
  andThen<U, F>(fn: (data: T) => Result<U, F>): Result<U, F>;
  unwrapOr(_defaultValue: T): T;
  unwrap(): T;
  expect(_message: string): T;
};

/**
 * Represents a failed result containing an error of type E
 */
export type Err<E> = {
  readonly success: false;
  readonly data: null;
  readonly error: E;
  isOk(): this is never;
  isErr(): this is Err<E>;
  map<U>(_fn: (data: never) => U): Result<U, E>;
  mapErr<F>(fn: (error: E) => F): Result<never, F>;
  andThen<U, F>(_fn: (data: never) => Result<U, F>): Result<U, E>;
  unwrapOr<T>(defaultValue: T): T;
  unwrap(): never;
  expect(message: string): never;
};

/**
 * A Result can be either Ok (success) or Err (failure)
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Creates a successful Result
 *
 * @param data - The success value
 * @returns An Ok Result containing the data
 *
 * @example
 * ```typescript
 * const user = { id: 1, name: 'John' };
 * const result = ok(user);
 * console.log(result.data); // { id: 1, name: 'John' }
 * ```
 *
 * @example With method chaining
 * ```typescript
 * const result = ok(5)
 *   .map(x => x * 2)
 *   .map(x => x.toString()); // ok("10")
 * ```
 */
export function ok<T>(data: T): Ok<T> {
  return {
    success: true,
    data,
    error: null,
    isOk(): this is Ok<T> {
      return true;
    },
    isErr(): this is never {
      return false;
    },
    map<U>(fn: (data: T) => U): Result<U, never> {
      return ok(fn(data));
    },
    mapErr<F>(_fn: (error: never) => F): Result<T, F> {
      return this as unknown as Result<T, F>;
    },
    andThen<U, F>(fn: (data: T) => Result<U, F>): Result<U, F> {
      return fn(data);
    },
    unwrapOr(_defaultValue: T): T {
      return data;
    },
    unwrap(): T {
      return data;
    },
    expect(_message: string): T {
      return data;
    },
  };
}

/**
 * Creates a failed Result
 *
 * @param error - The error value
 * @returns An Err Result containing the error
 *
 * @example
 * ```typescript
 * const result = err('User not found');
 * console.log(result.error); // 'User not found'
 * ```
 *
 * @example With method chaining
 * ```typescript
 * const result = err('not_found')
 *   .mapErr(code => ({ code, message: 'Resource not found' }));
 * ```
 */
export function err<E>(error: E): Err<E> {
  return {
    success: false,
    data: null,
    error,
    isOk(): this is never {
      return false;
    },
    isErr(): this is Err<E> {
      return true;
    },
    map<U>(_fn: (data: never) => U): Result<U, E> {
      return this as unknown as Result<U, E>;
    },
    mapErr<F>(fn: (error: E) => F): Result<never, F> {
      return err(fn(error));
    },
    andThen<U, F>(_fn: (data: never) => Result<U, F>): Result<U, E> {
      return this as unknown as Result<U, E>;
    },
    unwrapOr<T>(defaultValue: T): T {
      return defaultValue;
    },
    unwrap(): never {
      throw new Error(
        `Called unwrap on an Err value: ${JSON.stringify(error)}`,
      );
    },
    expect(message: string): never {
      throw new Error(`${message}: ${JSON.stringify(error)}`);
    },
  };
}

/**
 * Utility functions for working with Results
 */
export const Result: {
  try<T>(fn: () => T): Result<T, unknown>;
  tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>>;
  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E>;
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>;
  andThen<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Result<U, E>,
  ): Result<U, E>;
  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T;
  all<T, E>(results: Array<Result<T, E>>): Result<T[], E>;
  unwrap<T, E>(result: Result<T, E>): T;
  expect<T, E>(result: Result<T, E>, message: string): T;
  collectErrors<T, E>(results: Array<Result<T, E>>): E[];
  partition<T, E>(results: Array<Result<T, E>>): [T[], E[]];
  isOk<T, E>(result: Result<T, E>): result is Ok<T>;
  isErr<T, E>(result: Result<T, E>): result is Err<E>;
} = {
  /**
   * Wraps a function that might throw in a Result
   *
   * @param fn - Function that might throw
   * @returns A Result containing either the return value or the caught error
   *
   * @example
   * ```typescript
   * const result = Result.try(() => JSON.parse(jsonString));
   * if (result.isOk()) {
   *   console.log('Parsed:', result.data);
   * } else {
   *   console.error('Parse error:', result.error);
   * }
   * ```
   */
  try<T>(fn: () => T): Result<T, unknown> {
    try {
      return ok(fn());
    } catch (error) {
      return err(error);
    }
  },

  /**
   * Async version of Result.try
   *
   * @param fn - Async function that might throw
   * @returns A Promise of a Result containing either the return value or the caught error
   */
  async tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, unknown>> {
    try {
      const data = await fn();
      return ok(data);
    } catch (error) {
      return err(error);
    }
  },

  /**
   * Maps over a successful Result, leaving errors unchanged
   *
   * @param result - The Result to map over
   * @param fn - Function to apply to the success value
   * @returns A new Result with the transformed success value
   *
   * @example
   * ```typescript
   * const result = Ok(5);
   * const doubled = Result.map(result, x => x * 2); // Ok(10)
   * ```
   */
  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    if (result.isOk()) {
      return ok(fn(result.data));
    }
    return result;
  },

  /**
   * Maps over a failed Result, leaving successes unchanged
   *
   * @param result - The Result to map over
   * @param fn - Function to apply to the error value
   * @returns A new Result with the transformed error value
   */
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (result.isErr()) {
      return err(fn(result.error));
    }
    return result;
  },

  /**
   * Chains Results together, useful for sequential operations that might fail
   *
   * @param result - The Result to chain from
   * @param fn - Function that takes the success value and returns a new Result
   * @returns The new Result, or the original error if the input was an error
   *
   * @example
   * ```typescript
   * const parseId = (str: string): Result<number, string> => {
   *   const num = parseInt(str);
   *   return isNaN(num) ? Err('Invalid number') : Ok(num);
   * };
   *
   * const findUser = (id: number): Result<User, string> => {
   *   // ... database lookup
   * };
   *
   * const result = Result.andThen(parseId('123'), findUser);
   * ```
   */
  andThen<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Result<U, E>,
  ): Result<U, E> {
    if (result.isOk()) {
      return fn(result.data);
    }
    return result;
  },

  /**
   * Returns the success value or a default value if the Result is an error
   *
   * @param result - The Result to unwrap
   * @param defaultValue - Value to return if Result is an error
   * @returns The success value or the default value
   *
   * @example
   * ```typescript
   * const result = Err('Something went wrong');
   * const value = Result.unwrapOr(result, 'default'); // 'default'
   * ```
   */
  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.isOk()) {
      return result.data;
    }
    return defaultValue;
  },

  /**
   * Combines multiple Results into a single Result containing an array
   * If any Result is an error, returns the first error encountered
   *
   * @param results - Array of Results to combine
   * @returns A Result containing an array of all success values, or the first error
   *
   * @example
   * ```typescript
   * const results = [ok(1), ok(2), ok(3)];
   * const combined = Result.all(results); // ok([1, 2, 3])
   *
   * const withError = [ok(1), err('error'), ok(3)];
   * const failed = Result.all(withError); // err('error')
   * ```
   */
  all<T, E>(results: Array<Result<T, E>>): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (result.isErr()) {
        return result;
      }
      values.push(result.data);
    }
    return ok(values);
  },

  /**
   * Returns the data from an Ok result, or throws if the result is an error
   *
   * @param result - The Result to unwrap
   * @returns The success value
   * @throws Error if the result is an Err
   *
   * @example
   * ```typescript
   * const result = ok(42);
   * const value = Result.unwrap(result); // 42
   *
   * const error = err('failed');
   * const value2 = Result.unwrap(error); // throws Error
   * ```
   */
  unwrap<T, E>(result: Result<T, E>): T {
    return result.unwrap();
  },

  /**
   * Returns the data from an Ok result, or throws with a custom message if error
   *
   * @param result - The Result to unwrap
   * @param message - Custom error message to throw
   * @returns The success value
   * @throws Error with the custom message if the result is an Err
   *
   * @example
   * ```typescript
   * const result = err('not_found');
   * const value = Result.expect(result, 'User must exist'); // throws "User must exist: not_found"
   * ```
   */
  expect<T, E>(result: Result<T, E>, message: string): T {
    return result.expect(message);
  },

  /**
   * Collects all errors from an array of Results
   * Returns an array of errors, or an empty array if all Results are Ok
   *
   * @param results - Array of Results to collect errors from
   * @returns Array of error values
   *
   * @example
   * ```typescript
   * const results = [ok(1), err('error1'), ok(3), err('error2')];
   * const errors = Result.collectErrors(results); // ['error1', 'error2']
   * ```
   */
  collectErrors<T, E>(results: Array<Result<T, E>>): E[] {
    const errors: E[] = [];
    for (const result of results) {
      if (result.isErr()) {
        errors.push(result.error);
      }
    }
    return errors;
  },

  /**
   * Partitions an array of Results into successes and failures
   *
   * @param results - Array of Results to partition
   * @returns A tuple of [successes, failures]
   *
   * @example
   * ```typescript
   * const results = [ok(1), err('error1'), ok(3), err('error2')];
   * const [successes, failures] = Result.partition(results);
   * // successes: [1, 3]
   * // failures: ['error1', 'error2']
   * ```
   */
  partition<T, E>(results: Array<Result<T, E>>): [T[], E[]] {
    const successes: T[] = [];
    const failures: E[] = [];
    for (const result of results) {
      if (result.isOk()) {
        successes.push(result.data);
      } else {
        failures.push(result.error);
      }
    }
    return [successes, failures];
  },

  /**
   * Type guard to check if a Result is Ok
   *
   * @param result - The Result to check
   * @returns True if the Result is Ok
   */
  isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.isOk();
  },

  /**
   * Type guard to check if a Result is Err
   *
   * @param result - The Result to check
   * @returns True if the Result is Err
   */
  isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return result.isErr();
  },
} as const;
