import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  account: string; // Can be username, email, or phone number

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
