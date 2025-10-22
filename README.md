# @brettchalupa/result

A TypeScript library implementing the Result pattern for type-safe error
handling, inspired by Rust's `Result<T, E>`.

View the package on JSR: https://jsr.io/@brettchalupa/result

## Why?

Traditional `try/catch` error handling in TypeScript is painful:

- ❌ **Invisible control flow** - Can't tell which functions throw by looking at
  signatures
- ❌ **No type safety** - Caught errors are `unknown`, TypeScript can't help you
- ❌ **Difficult to test** - Easy to miss error paths and leave them untested
- ❌ **Unclear propagation** - Hard to tell where errors originate when they
  bubble up

**Result makes errors explicit:**

```typescript
// ❌ Exception-based: Which functions throw? What error types?
function processUser(id: string): User {
  const user = findUser(id); // Throws? Maybe?
  return validateUser(user); // Throws? Who knows?
}

// ✅ Result-based: Clear from the signature what can fail
function processUser(id: string): Result<User, "NOT_FOUND" | "INVALID"> {
  const user = findUser(id); // Returns Result<User, "NOT_FOUND">
  return user.andThen(validateUser); // Type-safe chaining!
}
```

With Result, **errors are just values** - visible in the type system, easy to
handle, and impossible to ignore accidentally.

## Features

- **Type-safe error handling** - Errors are part of the function signature
- **Method chaining** - Fluent API for transforming and combining results
- **Zero dependencies** - Lightweight and fast
- **Full TypeScript support** - Complete type inference and safety
- **Well tested** - Comprehensive test suite with 50+ tests

## Installation

```bash
# Deno
deno add jsr:@brettchalupa/result

# pnpm 10.9+
pnpm add jsr:@brettchalupa/result

# yarn 4.9+
yarn add jsr:@brettchalupa/result

# npm, bun, and older versions of yarn or pnpm
npx jsr add @brettchalupa/result # replace npx with any of yarn dlx, pnpm dlx, or bunx
```

Or import directly in Deno without installation:

```typescript
import { err, ok, Result } from "jsr:@brettchalupa/result";

const result = ok(42);
```

## Quick Start

```typescript
import { err, ok, type Result } from "@brettchalupa/result";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Cannot divide by zero");
  }
  return ok(a / b);
}

const result = divide(10, 2);
if (result.isOk()) {
  console.log("Result:", result.data); // Result: 5
} else {
  console.error("Error:", result.error);
}
```

## Usage

### Basic Results

Create successful or failed results:

```typescript
import { err, ok } from "@brettchalupa/result";

// Success
const success = ok(42);
console.log(success.data); // 42

// Failure
const failure = err("Something went wrong");
console.log(failure.error); // "Something went wrong"
```

### Method Chaining

Transform results with a fluent API:

```typescript
const result = ok(5)
  .map((x) => x * 2)
  .map((x) => x.toString()); // ok("10")

const error = err("not_found").mapErr((code) => ({
  code,
  message: "Resource not found",
}));
```

### Handling Async Operations

```typescript
import { Result } from "@brettchalupa/result";

// Wrap throwing code
const parsed = Result.try(() => JSON.parse(jsonString));

// Wrap async operations
const data = await Result.tryAsync(() => fetch(url).then((r) => r.json()));
```

### Combining Results

```typescript
import { err, ok, Result } from "@brettchalupa/result";

// Collect all successes or get first error
const results = [ok(1), ok(2), ok(3)];
const combined = Result.all(results); // ok([1, 2, 3])

// Partition successes and failures
const mixed = [ok(1), err("error"), ok(3)];
const [successes, failures] = Result.partition(mixed);
// successes: [1, 3]
// failures: ["error"]
```

### Repository Pattern

```typescript
import { err, ok, type Result } from "@brettchalupa/result";

type User = { id: string; name: string };

// Define your own domain-specific error types
type DbError = "NOT_FOUND" | "CONNECTION_ERROR" | "PERMISSION_DENIED";

async function findUser(id: string): Promise<Result<User, DbError>> {
  try {
    const user = await db.findOne({ id });
    if (!user) {
      return err("NOT_FOUND");
    }
    return ok(user);
  } catch (error) {
    return err("CONNECTION_ERROR");
  }
}
```

## API Reference

### Constructors

- `ok<T>(data: T): Ok<T>` - Create a successful result
- `err<E>(error: E): Err<E>` - Create a failed result

### Instance Methods

Both `Ok` and `Err` types support:

- `.isOk()` - Type guard for success
- `.isErr()` - Type guard for failure
- `.map(fn)` - Transform the success value
- `.mapErr(fn)` - Transform the error value
- `.andThen(fn)` - Chain operations that return Results
- `.unwrapOr(defaultValue)` - Get value or default
- `.unwrap()` - Get value or throw
- `.expect(message)` - Get value or throw with message

### Utility Functions

The `Result` namespace provides:

- `Result.try(fn)` - Wrap a throwing function
- `Result.tryAsync(fn)` - Wrap an async throwing function
- `Result.all(results)` - Combine results
- `Result.partition(results)` - Separate successes and failures
- `Result.collectErrors(results)` - Get all errors
- `Result.map(result, fn)` - Static map function
- `Result.mapErr(result, fn)` - Static mapErr function
- `Result.andThen(result, fn)` - Static andThen function
- `Result.unwrapOr(result, default)` - Static unwrapOr function
- `Result.unwrap(result)` - Static unwrap function
- `Result.expect(result, message)` - Static expect function

## Development

```bash
# Run tests
deno test

# Run all checks (format, lint, type check, test)
deno task ok

# Watch mode
deno task dev
```

## License

This is free and unencumbered software released into the public domain. See
[UNLICENSE](./UNLICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
