import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsVoucherCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isVoucherCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Validate CAKE-{8 uppercase alphanumeric characters} format
          const voucherCodeRegex = /^CAKE-[A-Z0-9]{8}$/;
          return voucherCodeRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid voucher code in format CAKE-XXXXXXXX`;
        },
      },
    });
  };
}
