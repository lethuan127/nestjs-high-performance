export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    username: string;
    phone: string;
    birthday: Date;
    latestLogin: Date;
  };
}

export class UserResponseDto {
  id: string;
  fullname: string;
  email: string;
  username: string;
  phone: string;
  birthday: Date;
  latestLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}
