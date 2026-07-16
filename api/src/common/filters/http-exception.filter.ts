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

const HTTP_STATUS_LABELS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
};

/**
 * Maps all thrown errors to the stable API_SPEC §4.1 envelope.
 * Stack traces stay in server logs only; production bodies never include them (REQ-F-13).
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
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request?.url ?? '/',
      };
      response.status(fallback.statusCode).json(fallback);
    }
  }

  private buildEnvelope(
    exception: unknown,
    request: Request,
  ): ErrorResponseDto {
    const path = request.url ?? '/';
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        statusCode,
        error: HTTP_STATUS_LABELS[statusCode] ?? exception.name,
        message: this.extractHttpMessage(exception),
        timestamp,
        path,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
      timestamp,
      path,
    };
  }

  private extractHttpMessage(exception: HttpException): string {
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return body;
    }

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = (body as { message: string | string[] }).message;
      if (Array.isArray(message)) {
        // ValidationPipe often returns string[]; join for a single envelope message.
        return message.join('; ');
      }
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return exception.message || 'Unexpected error';
  }

  private logException(
    exception: unknown,
    envelope: ErrorResponseDto,
  ): void {
    const stack =
      exception instanceof Error ? exception.stack : undefined;

    if (envelope.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${envelope.statusCode} ${envelope.error} ${envelope.path}: ${envelope.message}`,
        stack,
      );
      return;
    }

    this.logger.warn(
      `${envelope.statusCode} ${envelope.error} ${envelope.path}: ${envelope.message}`,
    );
  }
}
