import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { setRequestUserId } from '../logging/request-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const { method } = req;
    const url = req.originalUrl ?? req.url;

    if (req.user?.id) {
      setRequestUserId(req.user.id);
    }

    const start = Date.now();
    this.logger.log(`--> ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`<-- ${method} ${url} ${res.statusCode} ${Date.now() - start}ms`);
      }),
      catchError((error) => {
        const status = error?.status ?? 500;
        this.logger.warn(`<-- ${method} ${url} ${status} ${Date.now() - start}ms - ${error?.message}`);
        return throwError(() => error);
      }),
    );
  }
}
