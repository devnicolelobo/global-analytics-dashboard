/**
 * Stable JSON error envelope for all HTTP error responses (API_SPEC §4.1).
 * Production responses must never include stack traces (REQ-F-13).
 */
export interface ErrorResponseDto {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}
