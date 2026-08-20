#!/usr/bin/env -S deno run
/**
 * Example usage of @brettchalupa/result
 *
 * Run with: deno run example.ts
 */

import { err, ok, Result, type Result as ResultType } from "./mod.ts";

// Example 1: Simple division with error handling
console.log("=== Example 1: Safe Division ===");

function divide(a: number, b: number): ResultType<number, string> {
  if (b === 0) {
    return err("Cannot divide by zero");
  }
  return ok(a / b);
}

const result1 = divide(10, 2);
if (result1.isOk()) {
  console.log(`✅ 10 / 2 = ${result1.data}`);
} else {
  console.log(`❌ Error: ${result1.error}`);
}

const result2 = divide(10, 0);
if (result2.isOk()) {
  console.log(`✅ 10 / 0 = ${result2.data}`);
} else {
  console.log(`❌ Error: ${result2.error}`);
}

// Example 2: Parsing and validation with type-safe errors
console.log("\n=== Example 2: User Validation ===");

type ValidationError = "EMPTY_NAME" | "INVALID_AGE" | "AGE_OUT_OF_RANGE";
type User = { name: string; age: number };

function parseAge(input: string): ResultType<number, ValidationError> {
  const age = parseInt(input, 10);
  if (isNaN(age)) {
    return err("INVALID_AGE");
  }
  if (age < 0 || age > 150) {
    return err("AGE_OUT_OF_RANGE");
  }
  return ok(age);
}

function createUser(
  name: string,
  ageInput: string,
): ResultType<User, ValidationError> {
  if (name.trim() === "") {
    return err("EMPTY_NAME");
  }

  return parseAge(ageInput).andThen((age) => ok({ name, age }));
}

const validUser = createUser("Alice", "30");
if (validUser.isOk()) {
  console.log(
    `✅ Created user: ${validUser.data.name}, age ${validUser.data.age}`,
  );
}

const invalidAge = createUser("Bob", "not a number");
if (invalidAge.isErr()) {
  console.log(`❌ Validation error: ${invalidAge.error}`);
}

const emptyName = createUser("", "25");
if (emptyName.isErr()) {
  console.log(`❌ Validation error: ${emptyName.error}`);
}

// Example 3: Method chaining
console.log("\n=== Example 3: Method Chaining ===");

const chained = ok({ firstName: "alice", lastName: "smith" })
  .map((user) => `${user.firstName} ${user.lastName}`)
  .map((name) => name.toUpperCase())
  .map((name) => `Hello, ${name}!`);

if (chained.isOk()) {
  console.log(`✅ ${chained.data}`);
}

// Example 4: Wrapping throwing code
console.log("\n=== Example 4: Safe JSON Parsing ===");

const validJson = Result.try(() => JSON.parse('{"name": "Alice"}'));
if (validJson.isOk()) {
  console.log(`✅ Parsed: ${JSON.stringify(validJson.data)}`);
}

const invalidJson = Result.try(() => JSON.parse("not valid json"));
if (invalidJson.isErr()) {
  console.log(`❌ Parse failed: ${(invalidJson.error as Error).message}`);
}

// Example 5: Combining multiple results
console.log("\n=== Example 5: Combining Results ===");

const numbers = ["1", "2", "3", "4", "5"];
const parseResults = numbers.map((n) => parseAge(n));

const combined = Result.all(parseResults);
if (combined.isOk()) {
  console.log(`✅ All parsed: [${combined.data.join(", ")}]`);
}

// With an error
const mixedNumbers = ["1", "2", "invalid", "4", "5"];
const mixedResults = mixedNumbers.map((n) => parseAge(n));
const combinedMixed = Result.all(mixedResults);

if (combinedMixed.isErr()) {
  console.log(`❌ Failed to parse all: ${combinedMixed.error}`);
}

// Using partition to handle partial failures
const [successes, failures] = Result.partition(mixedResults);
console.log(
  `ℹ️  Parsed ${successes.length} numbers, ${failures.length} failed`,
);
console.log(`   Successes: [${successes.join(", ")}]`);
console.log(`   Failures: [${failures.join(", ")}]`);

// Example 6: Async operations
console.log("\n=== Example 6: Async Operations ===");

type FetchError = "NETWORK_ERROR" | "INVALID_JSON";

async function fetchUser(
  id: number,
): Promise<ResultType<{ id: number; name: string }, FetchError>> {
  // Simulate an API call
  const result = await Result.tryAsync(async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (id === 1) {
      return { id: 1, name: "Alice" };
    } else if (id === 2) {
      return { id: 2, name: "Bob" };
    } else {
      throw new Error("User not found");
    }
  });

  return result.mapErr(() => "NETWORK_ERROR" as FetchError);
}

const user1 = await fetchUser(1);
if (user1.isOk()) {
  console.log(`✅ Fetched user: ${user1.data.name}`);
}

const user999 = await fetchUser(999);
if (user999.isErr()) {
  console.log(`❌ Fetch failed: ${user999.error}`);
}

// Example 7: Error transformation
console.log("\n=== Example 7: Error Transformation ===");

const errorResult = err("not_found")
  .mapErr((code) => ({
    code,
    message: "Resource not found",
    timestamp: Date.now(),
  }));

if (errorResult.isErr()) {
  console.log(`❌ Structured error: ${JSON.stringify(errorResult.error)}`);
}

// Example 8: unwrapOr for default values
console.log("\n=== Example 8: Default Values ===");

const missingConfig = err("CONFIG_NOT_FOUND");
const configValue = missingConfig.unwrapOr("default-value");
console.log(`ℹ️  Config value: ${configValue}`);

const presentConfig = ok("custom-value");
const configValue2 = presentConfig.unwrapOr("default-value");
console.log(`ℹ️  Config value: ${configValue2}`);

console.log("\n=== All examples complete! ===");
