const { cpSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const source = join(__dirname, "..", "..", "infrastructure", "database", "src", "migrations");
const destination = join(__dirname, "..", "dist", "infrastructure", "database", "src", "migrations");

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
