import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
/**
 * The transform interceptor.
 */
export class TransformInterceptor implements NestInterceptor {
  /**
   * @param {ExecutionContext} context The execution context.
   * @param {CallHandler} next The call handler.
   * @return {Observable<any>} The observable of the transformed data.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;
        return {
          data,
          statusCode,
        };
      }),
    );
  }
}
