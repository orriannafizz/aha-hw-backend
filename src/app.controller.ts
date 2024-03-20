import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
/**
 * The main application controller.
 */
export class AppController {
  /**
   * @param {AppService} appService The application service.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * @return {string} A welcome message.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
