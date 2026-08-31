import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
export class CreateUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/)
  @Matches(/[a-z]/)
  @Matches(/[0-9]/)
  password!: string;
}
