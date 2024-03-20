import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
/**
 * PrismaService
 */
export class PrismaService extends PrismaClient implements OnModuleInit {
  /**
   * Connects to the database when the module is initialized.
   */
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('Error connecting to the database', error);
      throw error;
    }
  }

  /**
   * Disconnects from the database when the module is destroyed.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
