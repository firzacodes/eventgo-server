import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/auth.schema';
import { generateReferralCode } from 'src/common/libs/generateReferralCode';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, name, password, referralCode } = dto;

    const emailExists = await this.prisma.user.findUnique({ where: { email } });
    if (emailExists)
      throw new ConflictException('Oops! Email sudah digunakan!');

    let owner: any = null;

    if (referralCode) {
      owner = await this.prisma.user.findUnique({
        where: { referralCode },
      });

      if (!owner) {
        throw new NotFoundException('Referral tidak valid!');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newRefCode: string;
    while (true) {
      newRefCode = generateReferralCode();
      const exists = await this.prisma.user.findUnique({
        where: { referralCode: newRefCode },
      });
      if (!exists) break;
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          referralCode: newRefCode,
          role: 'CUSTOMER',
        },
      });

      if (owner) {
        const hasPoint = await tx.point.findFirst({
          where: { userId: owner.id },
        });

        if (!hasPoint) {
          await tx.point.create({
            data: { total: 10000, userId: owner.id },
          });
        } else {
          await tx.point.update({
            where: { id: hasPoint.id },
            data: { total: { increment: 10000 } },
          });
        }
      }

      const tokens = await this.getTokens(user.id, user.email, user.role);

      const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

      await tx.user.update({
        where: { id: user.id },
        data: { hashedRefreshToken: hashedRefresh },
      });

      return {
        message: 'Registrasi sukses!',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          referral: user.referralCode,
          role: user.role,
        },
      };
    });
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.getTokens(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });

    return { message: 'Logged out' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedRefreshToken)
      throw new ForbiddenException('Access denied');

    const valid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!valid) throw new ForbiddenException('Access denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async getTokens(userId: string, email: string, role: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: process.env.JWT_ACCESS_SECRET as any,
        expiresIn: process.env.ACCESS_EXPIRES as any,
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET as any,
        expiresIn: process.env.REFRESH_EXPIRES as any,
      },
    );

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hashed },
    });
  }
}
