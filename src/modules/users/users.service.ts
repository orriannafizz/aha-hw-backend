import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { UserPartialEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Queue } from 'bull';
import { EMAIL_QUEUE } from '@/constants';
import { InjectQueue } from '@nestjs/bull';
import * as bcrypt from 'bcrypt';
import { UserStatics } from './dto/user-statics.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Injectable()
/**
 * Service dealing with user operations.
 */
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
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
        loginTimes: true,
        email: true,
        isVerified: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const { password, ...rest } = user;

    return {
      ...rest,
      hasPassword: !!password,
    };
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
   * get Daily statics
   * @return {Promise<UserStatics>} The user's daily statistics.
   */
  async getUserStatics(): Promise<UserStatics> {
    const usersCount = await this.prismaService.user.count();
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    // YYYY-MM-DD
    const formattedToday = today.toISOString().split('T')[0];
    const formattedSevenDaysAgo = sevenDaysAgo.toISOString().split('T')[0];

    const todayStatics = (await this.prismaService.dailyStatics.findFirst({
      where: {
        date: formattedToday,
      },
      select: {
        loginTimes: true,
      },
    })) || { loginTimes: 0 };

    const { loginTimes: todayLoginTimes } = todayStatics;

    const last7DaysStatics = (await this.prismaService.dailyStatics.aggregate({
      _avg: {
        loginTimes: true,
      },
      where: {
        date: {
          gte: formattedSevenDaysAgo,
          lte: formattedToday,
        },
      },
    })) || { _avg: { loginTimes: 0 } };

    const { _avg } = last7DaysStatics;
    const { loginTimes: last7DaysAvgLoginTimes } = _avg;

    return {
      usersCount,
      todayLoginTimes,
      last7DaysAvgLoginTimes: last7DaysAvgLoginTimes || 0,
    };
  }

  /**
   * Adds a verify email event to the queue.
   * @param {string} id The ID of the user to send the email to.
   * @return {Promise<{ message: string }>} Confirmation that the email was sent.
   */
  async addVerifyEmailEvent(id: string): Promise<{ message: string }> {
    // get email and username by user id

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: {
        id,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const { email, username, isVerified, emailVerifyToken } = user;

    // check if email is already verified
    if (isVerified) {
      throw new HttpException('Email already verified', HttpStatus.BAD_REQUEST);
    }

    // add verify email event to queue
    await this.queue.add(
      EMAIL_QUEUE.EVENTS.VERIFICATION,
      {
        email,
        username,
        emailVerifyToken,
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

  /**
   * verify email by code
   * @param {string} emailVerifyToken email token
   * @return {{ message: string }} Confirmation that the email was verified.
   */
  async verifyEmail(emailVerifyToken: string) {
    // get user by token
    const user = await this.prismaService.user.update({
      where: {
        emailVerifyToken,
      },
      data: {
        isVerified: true,
        emailVerifyToken: null,
      },
    });

    // if no user found, throw an error
    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    return { message: 'Email verified successfully' };
  }

  /**
   * @param {ResetPasswordDto} dto The reset password details.
   * @return {Promise<UserPartialEntity>} Return findOne user
   */
  async resetPassword(dto: ResetPasswordDto) {
    try {
      const { id, oldPassword, newPassword } = dto;
      // get user by email
      const user = await this.prismaService.user.findUnique({
        where: {
          id,
        },
      });

      // if no user found, throw an error
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // if user is register by oauth
      const isPasswordNull = user.password === null;

      // compare old password
      if (!isPasswordNull) {
        try {
          const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            user.password,
          );

          if (!isPasswordMatch) {
            throw new HttpException(
              'Invalid old password',
              HttpStatus.BAD_REQUEST,
            );
          }
        } catch (error) {
          throw new HttpException(
            'Invalid old password',
            HttpStatus.BAD_REQUEST,
          );
        }
        try {
          const isNewPasswordSameAsOld = await bcrypt.compare(
            newPassword,
            user.password,
          );
          if (isNewPasswordSameAsOld) {
            throw new HttpException(
              'New password cannot be same as old password',
              HttpStatus.BAD_REQUEST,
            );
          }
        } catch (error) {
          throw new HttpException(
            'New password cannot be same as old password',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prismaService.user.update({
        where: {
          id,
        },
        data: {
          password: hashedPassword,
        },
      });

      return this.findOne(user.id);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
