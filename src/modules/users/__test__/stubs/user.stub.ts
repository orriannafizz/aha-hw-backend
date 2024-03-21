import { UserEntity, UserPartialEntity } from '../../entities/user.entity';

export const userPartialStub: UserPartialEntity = {
  id: '1',
  username: 'test',
  email: 'test@example.com',
  hasPassword: false,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const userStub: UserEntity = {
  password: 'Password!123',
  ...userPartialStub,
} as UserEntity;
