import { assertEquals, assertThrows } from "@std/assert";
import { err, ok, Result } from "./mod.ts";

// ====================
// Basic Constructor Tests
// ====================

Deno.test("ok() creates a successful result", () => {
  const result = ok(42);
  assertEquals(result.success, true);
  assertEquals(result.data, 42);
  assertEquals(result.error, null);
  assertEquals(result.isOk(), true);
  assertEquals(result.isErr(), false);
});

Deno.test("ok() works with different data types", () => {
  const stringResult = ok("hello");
  assertEquals(stringResult.data, "hello");

  const objectResult = ok({ name: "Alice", age: 30 });
  assertEquals(objectResult.data, { name: "Alice", age: 30 });

  const arrayResult = ok([1, 2, 3]);
  assertEquals(arrayResult.data, [1, 2, 3]);

  const nullResult = ok(null);
  assertEquals(nullResult.data, null);
});

Deno.test("err() creates a failed result", () => {
  const result = err("something went wrong");
  assertEquals(result.success, false);
  assertEquals(result.data, null);
  assertEquals(result.error, "something went wrong");
  assertEquals(result.isOk(), false);
  assertEquals(result.isErr(), true);
});

Deno.test("err() works with different error types", () => {
  const stringError = err("error message");
  assertEquals(stringError.error, "error message");

  const objectError = err({ code: 404, message: "Not found" });
  assertEquals(objectError.error, { code: 404, message: "Not found" });

  const numberError = err(500);
  assertEquals(numberError.error, 500);
});

// ====================
// Method Chaining Tests - map()
// ====================

Deno.test("ok().map() transforms the success value", () => {
  const result = ok(5).map((x) => x * 2);
  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.data, 10);
  }
});

Deno.test("ok().map() can chain multiple transformations", () => {
  const result = ok(5)
    .map((x) => x * 2)
    .map((x) => x + 1)
    .map((x) => x.toString());
  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.data, "11");
  }
});

Deno.test("err().map() does not transform the error", () => {
  const result = err("error").map((x: number) => x * 2);
  assertEquals(result.isErr(), true);
  if (result.isErr()) {
    assertEquals(result.error, "error");
  }
});

// ====================
// Method Chaining Tests - mapErr()
// ====================

Deno.test("ok().mapErr() does not transform the success value", () => {
  const result = ok(42).mapErr((e: string) => e.toUpperCase());
  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.data, 42);
  }
});

Deno.test("err().mapErr() transforms the error value", () => {
  const result = err("error").mapErr((e) => e.toUpperCase());
  assertEquals(result.isErr(), true);
  if (result.isErr()) {
    assertEquals(result.error, "ERROR");
  }
});

Deno.test("err().mapErr() can transform error to different type", () => {
  const result = err("not_found").mapErr((code) => ({
    code,
    message: "Resource not found",
  }));
  assertEquals(result.isErr(), true);
  if (result.isErr()) {
    assertEquals(result.error, {
      code: "not_found",
      message: "Resource not found",
    });
  }
});

// ====================
// Method Chaining Tests - andThen()
// ====================

Deno.test("ok().andThen() chains successful operations", () => {
  const parseNumber = (str: string) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? err("invalid number") : ok(num);
  };

  const result = ok("42").andThen(parseNumber);
  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.data, 42);
  }
});

Deno.test("ok().andThen() propagates errors from chained operation", () => {
  const parseNumber = (str: string) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? err("invalid number") : ok(num);
  };

  const result = ok("not-a-number").andThen(parseNumber);
  assertEquals(result.isErr(), true);
  if (result.isErr()) {
    assertEquals(result.error, "invalid number");
  }
});

Deno.test("err().andThen() does not execute the function", () => {
  let executed = false;
  const result = err("initial error").andThen(() => {
    executed = true;
    return ok(42);
  });

  assertEquals(executed, false);
  assertEquals(result.isErr(), true);
  if (result.isErr()) {
    assertEquals(result.error, "initial error");
  }
});

// ====================
// Method Chaining Tests - unwrapOr()
// ====================

Deno.test("ok().unwrapOr() returns the success value", () => {
  const result = ok(42);
  assertEquals(result.unwrapOr(0), 42);
});

Deno.test("err().unwrapOr() returns the default value", () => {
  const result = err("error");
  assertEquals(result.unwrapOr(0), 0);
});

// ====================
// Method Chaining Tests - unwrap()
// ====================

Deno.test("ok().unwrap() returns the success value", () => {
  const result = ok(42);
  assertEquals(result.unwrap(), 42);
});

Deno.test("err().unwrap() throws an error", () => {
  const result = err("something failed");
  assertThrows(
    () => result.unwrap(),
    Error,
    'Called unwrap on an Err value: "something failed"',
  );
});

// ====================
// Method Chaining Tests - expect()
// ====================

Deno.test("ok().expect() returns the success value", () => {
  const result = ok(42);
  assertEquals(result.expect("This should not fail"), 42);
});

Deno.test("err().expect() throws with custom message", () => {
  const result = err("not_found");
  assertThrows(
    () => result.expect("User must exist"),
    Error,
    'User must exist: "not_found"',
  );
});

// ====================
// Result.try() Tests
// ====================

Deno.test("Result.try() catches successful function execution", () => {
  const result = Result.try(() => JSON.parse('{"valid": "json"}'));
  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.data, { valid: "json" });
  }
});

Deno.test("Result.try() catches thrown errors", () => {
  const result = Result.try(() => JSON.parse("invalid json"));
  assertEquals(result.isErr(), true);
});

Deno.test("Result.try() works with arbitrary functions", () => {
  const divide = (a: number, b: number) => {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  };

  const success = Result.try(() => divide(10, 2));
  assertEquals(success.isOk(), true);
  if (success.isOk()) {
    assertEquals(success.data, 5);
  }

  const failure = Result.try(() => divide(10, 0));
  assertEquals(failure.isErr(), true);
});

// ====================
// Result.tryAsync() Tests
// ====================

Deno.test("Result.tryAsync() catches successful async execution", async () => {
  const result = await Result.tryAsync(() => Promise.resolve(42));
  assertEquals(result.isOk(), true);
  if (result.isOk()) {
    assertEquals(result.data, 42);
  }
});

Deno.test("Result.tryAsync() catches rejected promises", async () => {
  const result = await Result.tryAsync(() =>
    Promise.reject(new Error("Async error"))
  );
  assertEquals(result.isErr(), true);
});

Deno.test("Result.tryAsync() catches thrown errors in async functions", async () => {
  const result = await Result.tryAsync(() =>
    Promise.reject(new Error("Thrown in async"))
  );
  assertEquals(result.isErr(), true);
});

// ====================
// Result.map() Tests
// ====================

Deno.test("Result.map() transforms ok values", () => {
  const result = ok(5);
  const mapped = Result.map(result, (x) => x * 2);
  assertEquals(mapped.isOk(), true);
  if (mapped.isOk()) {
    assertEquals(mapped.data, 10);
  }
});

Deno.test("Result.map() leaves errors unchanged", () => {
  const result = err("error");
  const mapped = Result.map(result, (x: number) => x * 2);
  assertEquals(mapped.isErr(), true);
  if (mapped.isErr()) {
    assertEquals(mapped.error, "error");
  }
});

// ====================
// Result.mapErr() Tests
// ====================

Deno.test("Result.mapErr() transforms error values", () => {
  const result = err("error");
  const mapped = Result.mapErr(result, (e) => e.toUpperCase());
  assertEquals(mapped.isErr(), true);
  if (mapped.isErr()) {
    assertEquals(mapped.error, "ERROR");
  }
});

Deno.test("Result.mapErr() leaves ok values unchanged", () => {
  const result = ok(42);
  const mapped = Result.mapErr(result, (e: string) => e.toUpperCase());
  assertEquals(mapped.isOk(), true);
  if (mapped.isOk()) {
    assertEquals(mapped.data, 42);
  }
});

// ====================
// Result.andThen() Tests
// ====================

Deno.test("Result.andThen() chains operations", () => {
  const parseId = (str: string) => {
    const num = parseInt(str, 10);
    return isNaN(num) ? err("Invalid number") : ok(num);
  };

  const result = ok("123");
  const chained = Result.andThen(result, parseId);
  assertEquals(chained.isOk(), true);
  if (chained.isOk()) {
    assertEquals(chained.data, 123);
  }
});

Deno.test("Result.andThen() propagates errors", () => {
  const result = err("initial error");
  const chained = Result.andThen(result, () => ok(42));
  assertEquals(chained.isErr(), true);
  if (chained.isErr()) {
    assertEquals(chained.error, "initial error");
  }
});

// ====================
// Result.unwrapOr() Tests
// ====================

Deno.test("Result.unwrapOr() returns data for ok", () => {
  const result = ok(42);
  assertEquals(Result.unwrapOr(result, 0), 42);
});

Deno.test("Result.unwrapOr() returns default for err", () => {
  const result = err("error");
  assertEquals(Result.unwrapOr(result, 99), 99);
});

// ====================
// Result.all() Tests
// ====================

Deno.test("Result.all() combines all successful results", () => {
  const results = [ok(1), ok(2), ok(3)];
  const combined = Result.all(results);
  assertEquals(combined.isOk(), true);
  if (combined.isOk()) {
    assertEquals(combined.data, [1, 2, 3]);
  }
});

Deno.test("Result.all() returns first error", () => {
  const results = [ok(1), err("error1"), ok(3), err("error2")];
  const combined = Result.all(results);
  assertEquals(combined.isErr(), true);
  if (combined.isErr()) {
    assertEquals(combined.error, "error1");
  }
});

Deno.test("Result.all() handles empty array", () => {
  const results: Array<Result<number, string>> = [];
  const combined = Result.all(results);
  assertEquals(combined.isOk(), true);
  if (combined.isOk()) {
    assertEquals(combined.data, []);
  }
});

// ====================
// Result.unwrap() Tests
// ====================

Deno.test("Result.unwrap() returns value for ok", () => {
  const result = ok(42);
  assertEquals(Result.unwrap(result), 42);
});

Deno.test("Result.unwrap() throws for err", () => {
  const result = err("failed");
  assertThrows(
    () => Result.unwrap(result),
    Error,
    "Called unwrap on an Err value",
  );
});

// ====================
// Result.expect() Tests
// ====================

Deno.test("Result.expect() returns value for ok", () => {
  const result = ok(42);
  assertEquals(Result.expect(result, "Should not fail"), 42);
});

Deno.test("Result.expect() throws with message for err", () => {
  const result = err("not_found");
  assertThrows(
    () => Result.expect(result, "User must exist"),
    Error,
    "User must exist",
  );
});

// ====================
// Result.collectErrors() Tests
// ====================

Deno.test("Result.collectErrors() returns all errors", () => {
  const results = [ok(1), err("error1"), ok(3), err("error2")];
  const errors = Result.collectErrors(results);
  assertEquals(errors, ["error1", "error2"]);
});

Deno.test("Result.collectErrors() returns empty array when no errors", () => {
  const results = [ok(1), ok(2), ok(3)];
  const errors = Result.collectErrors(results);
  assertEquals(errors, []);
});

// ====================
// Result.partition() Tests
// ====================

Deno.test("Result.partition() separates successes and failures", () => {
  const results = [ok(1), err("error1"), ok(3), err("error2")];
  const [successes, failures] = Result.partition(results);
  assertEquals(successes, [1, 3]);
  assertEquals(failures, ["error1", "error2"]);
});

Deno.test("Result.partition() handles all successes", () => {
  const results = [ok(1), ok(2), ok(3)];
  const [successes, failures] = Result.partition(results);
  assertEquals(successes, [1, 2, 3]);
  assertEquals(failures, []);
});

Deno.test("Result.partition() handles all failures", () => {
  const results = [err("e1"), err("e2"), err("e3")];
  const [successes, failures] = Result.partition(results);
  assertEquals(successes, []);
  assertEquals(failures, ["e1", "e2", "e3"]);
});

// ====================
// Result.isOk() and Result.isErr() Tests
// ====================

Deno.test("Result.isOk() type guard works", () => {
  const result = ok(42);
  assertEquals(Result.isOk(result), true);
  if (Result.isOk(result)) {
    // Type should be narrowed to Ok<number>
    assertEquals(result.data, 42);
  }
});

Deno.test("Result.isErr() type guard works", () => {
  const result = err("error");
  assertEquals(Result.isErr(result), true);
  if (Result.isErr(result)) {
    // Type should be narrowed to Err<string>
    assertEquals(result.error, "error");
  }
});

// ====================
// Real-world Integration Tests
// ====================

Deno.test("Integration: Parse and validate user input", () => {
  type User = { name: string; age: number };

  const parseAge = (input: string): Result<number, string> => {
    const age = parseInt(input, 10);
    if (isNaN(age)) return err("Invalid age format");
    if (age < 0 || age > 150) return err("Age out of range");
    return ok(age);
  };

  const createUser = (name: string, age: number): Result<User, string> => {
    if (name.trim() === "") return err("Name cannot be empty");
    return ok({ name, age });
  };

  // Success case
  const result1 = parseAge("30").andThen((age) => createUser("Alice", age));
  assertEquals(result1.isOk(), true);
  if (result1.isOk()) {
    assertEquals(result1.data, { name: "Alice", age: 30 });
  }

  // Failure case - invalid age
  const result2 = parseAge("invalid").andThen((age) => createUser("Bob", age));
  assertEquals(result2.isErr(), true);
  if (result2.isErr()) {
    assertEquals(result2.error, "Invalid age format");
  }

  // Failure case - empty name
  const result3 = parseAge("25").andThen((age) => createUser("", age));
  assertEquals(result3.isErr(), true);
  if (result3.isErr()) {
    assertEquals(result3.error, "Name cannot be empty");
  }
});

Deno.test("Integration: Async repository pattern", async () => {
  type User = { id: string; name: string };
  type DbError = "NOT_FOUND" | "CONNECTION_ERROR";

  const mockDb = {
    findUser(id: string): Promise<User | null> {
      if (id === "1") return Promise.resolve({ id: "1", name: "Alice" });
      return Promise.resolve(null);
    },
  };

  async function findUserById(
    id: string,
  ): Promise<Result<User, DbError>> {
    return await Result.tryAsync(async () => {
      const user = await mockDb.findUser(id);
      if (!user) throw new Error("NOT_FOUND");
      return user;
    }).then((result) =>
      result.mapErr((error) => {
        if (error instanceof Error && error.message === "NOT_FOUND") {
          return "NOT_FOUND" as DbError;
        }
        return "CONNECTION_ERROR" as DbError;
      })
    );
  }

  // Success case
  const user = await findUserById("1");
  assertEquals(user.isOk(), true);
  if (user.isOk()) {
    assertEquals(user.data.name, "Alice");
  }

  // Not found case
  const notFound = await findUserById("999");
  assertEquals(notFound.isErr(), true);
  if (notFound.isErr()) {
    assertEquals(notFound.error, "NOT_FOUND");
  }
});

Deno.test("Integration: Batch processing with Result.all()", () => {
  const processNumber = (n: number): Result<number, string> => {
    if (n < 0) return err(`Negative number: ${n}`);
    return ok(n * 2);
  };

  // All succeed
  const numbers1 = [1, 2, 3, 4, 5];
  const results1 = numbers1.map(processNumber);
  const combined1 = Result.all(results1);
  assertEquals(combined1.isOk(), true);
  if (combined1.isOk()) {
    assertEquals(combined1.data, [2, 4, 6, 8, 10]);
  }

  // One fails
  const numbers2 = [1, 2, -3, 4, 5];
  const results2 = numbers2.map(processNumber);
  const combined2 = Result.all(results2);
  assertEquals(combined2.isErr(), true);

  // Using partition to handle partial failures
  const [successes, failures] = Result.partition(results2);
  assertEquals(successes, [2, 4, 8, 10]);
  assertEquals(failures, ["Negative number: -3"]);
});
