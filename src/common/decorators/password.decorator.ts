import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function ContainsLowercaseLetter(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'containsLowercaseLetter',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /[a-z]/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least one lowercase letter`;
        },
      },
    });
  };
}

export function ContainsUppercaseLetter(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'containsUppercaseLetter',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /[A-Z]/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least one uppercase letter`;
        },
      },
    });
  };
}

export function ContainsDigit(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'containsDigit',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /\d/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least one digit`;
        },
      },
    });
  };
}

export function ContainsSpecialCharacter(
  validationOptions?: ValidationOptions,
) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'containsSpecialCharacter',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /[!@#$%^&*(),.?":{}|<>]/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain at least one special character`;
        },
      },
    });
  };
}
