import { Injectable } from '@nestjs/common';

@Injectable()
/**
 * Application service.
 */
export class AppService {
  /**
   * hello
   * @return {string} A welcome message.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
