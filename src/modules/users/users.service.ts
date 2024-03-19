import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UserPartialEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Queue } from 'bull';
import { EMAIL_QUEUE } from 'src/constants';
import { InjectQueue } from '@nestjs/bull';
import * as bcrypt from 'bcrypt';

/**
 * Service dealing with user operations.
 */
@Injectable()
export class UsersService {
  /**
   * Creates an instance of UsersService.
   * @param {PrismaService} prismaService The Prisma service for database operations.
   * @param {Queue} queue The queue used for email events.
   */
  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue(EMAIL_QUEUE.QUEUE) private readonly queue: Queue,
  ) {}

  /**
   * Finds a user by ID.
   * @param {string} id The ID of the user to find.
   * @return {Promise<UserPartialEntity>} The found user.
   */
  async findOne(id: string): Promise<UserPartialEntity> {
    return this.prismaService.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Creates a new user.
   * @param {CreateUserDto} dto The data transfer object for creating a user.
   * @return {Promise<UserPartialEntity>} The created user.
   */
  async create(dto: CreateUserDto): Promise<UserPartialEntity> {
    const { username, email, password } = dto;

    // Check if email already exists
    const count = await this.prismaService.user.count({
      where: {
        email,
      },
    });

    // If email already exists, throw an error
    if (count > 0) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    try {
      const _user = await this.prismaService.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
        },
      });
      return this.findOne(_user.id);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Adds a verify email event to the queue.
   * @return {Promise<{ message: string }>} Confirmation that the email was sent.
   */
  async addVerifyEmailEvent(): Promise<{ message: string }> {
    await this.queue.add(
      EMAIL_QUEUE.EVENTS.VERIFICATION,
      {
        email: 'example@gmail.com',
        username: 'username',
        emailVerifyToken: 'token',
      },
      {
        // Retry 3 times with 5 seconds delay
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    );

    return { message: 'Email sent' };
  }
}
