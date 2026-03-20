export class AppError extends Error {
  readonly code: string;
  readonly exitCode: number;

  constructor(message: string, code: string, exitCode: number) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.exitCode = exitCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 2);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 3);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 4);
  }
}

export class ExternalToolError extends AppError {
  constructor(message: string) {
    super(message, "EXTERNAL_TOOL_ERROR", 5);
  }
}

export function toExitCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.exitCode;
  }

  return 1;
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
