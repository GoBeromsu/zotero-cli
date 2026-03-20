import { describe, expect, it } from "vitest";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ExternalToolError,
  toExitCode,
  toErrorMessage
} from "../src/application/errors.js";

describe("error hierarchy", () => {
  it("maps ValidationError to exit code 2", () => {
    expect(toExitCode(new ValidationError("bad input"))).toBe(2);
  });

  it("maps NotFoundError to exit code 3", () => {
    expect(toExitCode(new NotFoundError("missing"))).toBe(3);
  });

  it("maps ConflictError to exit code 4", () => {
    expect(toExitCode(new ConflictError("conflict"))).toBe(4);
  });

  it("maps ExternalToolError to exit code 5", () => {
    expect(toExitCode(new ExternalToolError("api error"))).toBe(5);
  });

  it("maps unknown errors to exit code 1", () => {
    expect(toExitCode(new Error("unknown"))).toBe(1);
    expect(toExitCode("string error")).toBe(1);
  });

  it("extracts message from Error instances", () => {
    expect(toErrorMessage(new ValidationError("test msg"))).toBe("test msg");
  });

  it("converts non-Error values to string", () => {
    expect(toErrorMessage(42)).toBe("42");
    expect(toErrorMessage(null)).toBe("null");
  });
});
