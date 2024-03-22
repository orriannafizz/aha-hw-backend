import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

/**
 * UserStatics DTO
 */
export class UserStatics {
  @IsNumber()
  @ApiProperty({
    example: 100,
    description: 'The total number of users',
  })
  usersCount: number;

  @IsNumber()
  @ApiProperty({
    example: 10,
    description: 'The total number of users who logged in today',
  })
  todayLoginTimes: number;

  @IsNumber()
  @ApiProperty({
    example: 10,
    description: 'The average number of users who logged last 7 days',
  })
  last7DaysAvgLoginTimes: number;
}
