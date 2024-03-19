import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { UserPartialEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Queue } from 'bull';
import { EMAIL_QUEUE } from 'src/constants';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectQueue(EMAIL_QUEUE.QUEUE) private readonly queue: Queue,
  ) {}

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

  async create(dto: CreateUserDto) {
    const { username, email, password } = dto;
    const count = await this.prismaService.user.count({
      where: {
        email,
      },
    });

    if (count > 0) {
      throw new HttpException('Email already exists', HttpStatus.CONFLICT);
    }

    const _user = await this.prismaService.user.create({
      data: {
        username,
        email,
        password,
      },
    });

    return this.findOne(_user.id);
  }

  async addVerifyEmailEvent() {
    // add verify email event to queue
    await this.queue.add(
      EMAIL_QUEUE.EVENTS.VERIFICATION,
      {
        email: 'orriannafizz@gmail.com',
        username: 'brian',
        emailVerifyToken: 'hi',
      },
      {
        // retry 3 times with 5 seconds delay
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
