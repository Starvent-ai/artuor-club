export class IncorrectPasswordError extends Error {
  constructor() {
    super("INCORRECT_PASSWORD");
  }
}

export class IncorrectSecurityAnswerError extends Error {
  constructor() {
    super("INCORRECT_SECURITY_ANSWER");
  }
}

export class SecurityNotConfiguredError extends Error {
  constructor() {
    super("SECURITY_NOT_CONFIGURED");
  }
}
