import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RoleEnum = z.enum(['CUSTOMER', 'ORGANIZER', 'ADMIN']);

export const RegisterSchema = z.object({
  name: z.string().min(6, 'Nama minimal 6 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  referralCode: z.string().optional().nullable(),
  role: RoleEnum.optional().default('CUSTOMER'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

export const LoginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
