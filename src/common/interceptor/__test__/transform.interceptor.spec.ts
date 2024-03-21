import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TransformInterceptor } from '../transform.interceptor';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TransformInterceptor],
    }).compile();

    interceptor = module.get<TransformInterceptor>(TransformInterceptor);
  });

  it('should transform response data', (done) => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as unknown as ExecutionContext;

    const next = {
      handle: () => of({ result: 'test' }),
    };

    interceptor.intercept(mockExecutionContext, next).subscribe({
      next: (transformed) => {
        expect(transformed).toEqual({
          data: { result: 'test' },
          statusCode: 200,
        });
      },
      complete: () => done(),
    });
  });
});
