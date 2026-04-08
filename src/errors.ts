/**
 * Error handling for PocketBase MCP
 * Provides structured error types and utilities for converting PocketBase SDK errors
 */

export enum ErrorType {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

/**
 * Custom error class for PocketBase MCP with structured error information
 */
export class PocketBaseMCPError extends Error {
  type: ErrorType;
  message: string;
  suggestion: string;
  statusCode?: number;
  isRetryable: boolean;

  constructor(
    type: ErrorType,
    message: string,
    suggestion: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'PocketBaseMCPError';
    this.type = type;
    this.message = message;
    this.suggestion = suggestion;
    this.statusCode = statusCode;
    this.isRetryable = this.determineRetryability(type);
  }

  private determineRetryability(type: ErrorType): boolean {
    return [
      ErrorType.NETWORK_ERROR,
      ErrorType.RATE_LIMITED,
      ErrorType.SERVER_ERROR,
      ErrorType.TIMEOUT_ERROR,
    ].includes(type);
  }
}

/**
 * Maps HTTP status codes to ErrorType
 */
const statusCodeToErrorType: Record<number, ErrorType> = {
  400: ErrorType.VALIDATION_ERROR,
  401: ErrorType.AUTH_ERROR,
  403: ErrorType.PERMISSION_DENIED,
  404: ErrorType.NOT_FOUND,
  429: ErrorType.RATE_LIMITED,
  500: ErrorType.SERVER_ERROR,
  502: ErrorType.SERVER_ERROR,
  503: ErrorType.SERVER_ERROR,
  504: ErrorType.SERVER_ERROR,
};

/**
 * Maps network error codes to ErrorType
 */
const networkErrorToErrorType: Record<string, ErrorType> = {
  ECONNRESET: ErrorType.NETWORK_ERROR,
  ENOTFOUND: ErrorType.NETWORK_ERROR,
  ECONNREFUSED: ErrorType.NETWORK_ERROR,
  ETIMEDOUT: ErrorType.TIMEOUT_ERROR,
  ESOCKETTIMEDOUT: ErrorType.TIMEOUT_ERROR,
};

/**
 * Default suggestions for each error type
 */
const defaultSuggestions: Record<ErrorType, string> = {
  [ErrorType.NOT_FOUND]: 'Check if the resource exists or the ID is correct.',
  [ErrorType.VALIDATION_ERROR]: 'Review the request payload and ensure all required fields are provided with valid values.',
  [ErrorType.AUTH_ERROR]: 'Re-authenticate with valid credentials or refresh your authentication token.',
  [ErrorType.PERMISSION_DENIED]: 'Verify that your user account has the necessary permissions for this operation.',
  [ErrorType.NETWORK_ERROR]: 'Check your network connection and the PocketBase server status. Try again later.',
  [ErrorType.RATE_LIMITED]: 'Wait before retrying. Consider implementing exponential backoff for repeated requests.',
  [ErrorType.SERVER_ERROR]: 'The PocketBase server is experiencing issues. Try again later.',
  [ErrorType.TIMEOUT_ERROR]: 'The request took too long. Try again with a longer timeout or check server load.',
};

/**
 * Converts a PocketBase SDK error or generic error to PocketBaseMCPError
 */
export function wrapError(error: unknown): PocketBaseMCPError {
  // Handle already wrapped errors
  if (error instanceof PocketBaseMCPError) {
    return error;
  }

  // Extract message and status code from various error formats
  let message = 'An unknown error occurred';
  let statusCode: number | undefined;

  if (error instanceof Error) {
    message = error.message;

    // Check for status code in error response
    const statusProp = (error as unknown as Record<string, unknown>).status;
    if (typeof statusProp === 'number') {
      statusCode = statusProp;
    }

    // Check for response data with status
    const responseData = (error as unknown as Record<string, unknown>).data;
    if (responseData && typeof responseData === 'object') {
      const data = responseData as Record<string, unknown>;
      if (typeof data.code === 'number') {
        statusCode = data.code;
      }
    }
  }

  // Determine error type
  let errorType: ErrorType;

  if (statusCode && statusCodeToErrorType[statusCode]) {
    errorType = statusCodeToErrorType[statusCode]!;
  } else if (error instanceof Error) {
    // Check for network errors by code
    const errorCode = (error as NodeJS.ErrnoException).code;
    if (errorCode && networkErrorToErrorType[errorCode]) {
      errorType = networkErrorToErrorType[errorCode];
    } else if (message.toLowerCase().includes('timeout')) {
      errorType = ErrorType.TIMEOUT_ERROR;
    } else if (message.toLowerCase().includes('network') || message.toLowerCase().includes('connection')) {
      errorType = ErrorType.NETWORK_ERROR;
    } else {
      // Default to SERVER_ERROR for unknown errors
      errorType = ErrorType.SERVER_ERROR;
    }
  } else {
    errorType = ErrorType.SERVER_ERROR;
  }

  return new PocketBaseMCPError(
    errorType,
    message,
    defaultSuggestions[errorType],
    statusCode
  );
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof PocketBaseMCPError) {
    return error.isRetryable;
  }
  return false;
}

/**
 * Get error type from error
 */
export function getErrorType(error: unknown): ErrorType | undefined {
  if (error instanceof PocketBaseMCPError) {
    return error.type;
  }
  return undefined;
}