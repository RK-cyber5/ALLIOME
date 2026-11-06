/**
 * Shared API error type. Lives in its own module to avoid a circular import
 * between the client and the response validators.
 */

export class ApiError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
