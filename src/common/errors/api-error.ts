import { HttpException, HttpStatus } from "@nestjs/common";

export enum ApiErrorCode {
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  CONFLICT = "CONFLICT",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
}

export class ApiError extends HttpException {
  constructor(
    public readonly code: ApiErrorCode,
    status: HttpStatus,
    message: string,
  ) {
    super({ code, message, statusCode: status }, status);
  }
}
