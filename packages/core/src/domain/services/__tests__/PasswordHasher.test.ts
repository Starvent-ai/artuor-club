import { test } from "node:test";
import assert from "node:assert/strict";
import { PasswordHasher } from "../PasswordHasher";

test("verifies a correct password against its own hash", () => {
  const hasher = new PasswordHasher();
  const hash = hasher.hash("rezA-1234");
  assert.equal(hasher.verify("rezA-1234", hash), true);
});

test("rejects an incorrect password", () => {
  const hasher = new PasswordHasher();
  const hash = hasher.hash("rezA-1234");
  assert.equal(hasher.verify("wrong-password", hash), false);
});

test("produces a different hash each time due to random salt", () => {
  const hasher = new PasswordHasher();
  const firstHash = hasher.hash("same-password");
  const secondHash = hasher.hash("same-password");
  assert.notEqual(firstHash, secondHash);
});

test("rejects malformed stored hashes instead of throwing", () => {
  const hasher = new PasswordHasher();
  assert.equal(hasher.verify("anything", "not-a-real-hash"), false);
});
