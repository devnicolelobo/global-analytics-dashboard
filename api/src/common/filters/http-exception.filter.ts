import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../errors/error-response.dto';

/** Stable labels for the envelope `error` field (API_SPEC §4.1). */
const HTTP_STATUS_LABELS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

const GENERIC_INTERNAL_MESSAGE = 'Internal server error';

/**
 * Global filter: maps any thrown error to the stable API envelope.
 *
 * Security (REQ-F-13):
 * - Stack traces stay in server logs only — never in the HTTP body.
 * - Status 500 (and non-HTTP errors): generic client message.
 * - Operational 503 (e.g. health) may expose a controlled, safe message.
 * - Path omits query string so tokens/PII are not echoed in the envelope.
 * - Filter must not throw: minimal fallback if envelope building fails.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    try {
      const envelope = this.buildEnvelope(exception, request);
      this.logException(exception, envelope);
      response.status(envelope.statusCode).json(envelope);
    } catch (buildError: unknown) {
      this.logger.error(
        'Failed to build error envelope; returning minimal fallback',
        buildError instanceof Error ? buildError.stack : undefined,
      );
      const fallback: ErrorResponseDto = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: GENERIC_INTERNAL_MESSAGE,
        timestamp: new Date().toISOString(),
        path: this.safePath(request),
      };
      response.status(fallback.statusCode).json(fallback);
    }
  }

  private buildEnvelope(
    exception: unknown,
    request: Request,
  ): ErrorResponseDto {
    const path = this.safePath(request);
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      // Only 500 is forced generic. 503 (readiness) keeps a safe ops message.
      const hideDetails = statusCode === 500;

      return {
        statusCode,
        error:
          HTTP_STATUS_LABELS[statusCode] ??
          (hideDetails ? 'Internal Server Error' : 'Error'),
        message: hideDetails
          ? GENERIC_INTERNAL_MESSAGE
          : this.extractHttpMessage(exception),
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: GENERIC_INTERNAL_MESSAGE,
      timestamp,
      path,
    };
  }

  /**
   * Extracts a safe message from 4xx HttpException bodies.
   * ValidationPipe often returns `message: string[]` — join into one string.
   */
  private extractHttpMessage(exception: HttpException): string {
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return body;
    }

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: string | string[] }).message;
      if (Array.isArray(message)) {
        return message.join('; ');
      }
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return exception.message || 'Unexpected error';
  }

  /** Prefer pathname without query — avoid echoing credentials in `?token=`. */
  private safePath(request: Request | undefined): string {
    if (!request) {
      return '/';
    }
    const raw = request.path || request.url || '/';
    const q = raw.indexOf('?');
    return q === -1 ? raw : raw.slice(0, q);
  }

  private logException(exception: unknown, envelope: ErrorResponseDto): void {
    const stack = exception instanceof Error ? exception.stack : undefined;
    // Original detail for logs only — useful for ops, never sent to the client.
    const originalDetail =
      exception instanceof HttpException
        ? this.extractHttpMessage(exception)
        : exception instanceof Error
          ? exception.message
          : undefined;

    if (envelope.statusCode >= 500) {
      this.logger.error(
        `${envelope.statusCode} ${envelope.error} ${envelope.path}: ${originalDetail ?? envelope.message}`,
        stack,
      );
      return;
    }

    this.logger.warn(
      `${envelope.statusCode} ${envelope.error} ${envelope.path}: ${envelope.message}`,
    );
  }
}
