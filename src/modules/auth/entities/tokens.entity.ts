import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Token entity with the refresh token and access token.
 */
export class TokensEntity {
  @IsString()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhpIiwic3ViIjoiMGE1NzRkMGEtY2Q4Zi00NjRjLWIzYTktNmQzMjhiYzU5NzgxIiwiaWF0IjoxNzExMDkzMTk2LCJleHAiOjE3MTEwOTY3OTZ9.ht3e-PFLa5429Qq_nGuG7AetJisdwQlDpdFIi_hW53Q',
    description: 'The refresh token expires in 7 days',
  })
  refreshToken: string;

  @IsString()
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImhpIiwic3ViIjoiMGE1NzRkMGEtY2Q4Zi00NjRjLWIzYTktNmQzMjhiYzU5NzgxIiwiaWF0IjoxNzExMDkzMTk2LCJleHAiOjE3MTEwOTY3OTZ9.ht3e-PFLa5429Qq_nGuG7AsdJiyGwQlDpdFIi_hW53Q',
    description: 'The access token expires in 1 hour',
  })
  accessToken: string;
}
