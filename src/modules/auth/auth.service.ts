import { createToken } from '../../utils/jwt';
import { Role } from '../../../prisma/generated/prisma/enums';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import config from '../../config';
import { SignOptions } from 'jsonwebtoken';
import { Prisma } from '../../../prisma/generated/prisma/client';

const registerUser = async (payload: any) => {
  const { name, email, password, phone, role, hourlyRate, location, skills, bio, experienceYears } = payload;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User with this email already exists!');
  }

  const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_round));
  const userRole = role === 'TECHNICIAN' ? Role.TECHNICIAN : Role.CUSTOMER;

  const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: userRole,
      },
    });

    if (userRole === Role.TECHNICIAN) {
      await tx.technicianProfile.create({
        data: {
          userId: user.id,
          hourlyRate: hourlyRate || 0,
          location: location || 'Not Specified',
          skills: skills || [],
          bio: bio || '',
          experienceYears: experienceYears || 0,
        },
      });
    }

    return user;
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

const loginUser = async (payload: any) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found!');
  }

  if (user.status === 'BANNED') {
    throw new Error('Your account is banned!');
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new Error('Invalid credentials!');
  }

  const jwtPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions
  );

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token: accessToken,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      technicianProfile: true,
    },
  });

  return user;
};

export const AuthService = {
  registerUser,
  loginUser,
  getMe,
};