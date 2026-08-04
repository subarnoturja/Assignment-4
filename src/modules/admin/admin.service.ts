import { Prisma } from "../../../prisma/generated/prisma/client";
import { BookingStatus, Role, UserStatus } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";


// Get all users with search and role/status filtering
const getAllUsers = async (query: Record<string, any>) => {
  const { role, status, search } = query;

  const whereConditions: Prisma.UserWhereInput[] = [];

  if (role) {
    whereConditions.push({ role: role as Role });
  }

  if (status) {
    whereConditions.push({ status: status as UserStatus });
  }

  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.UserWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      createdAt: true,
      technicianProfile: {
        select: {
          id: true,
          rating: true,
          location: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
};

// Update user status (e.g. ACTIVE, BLOCKED/BANNED)
const updateUserStatus = async (userId: string, newStatus: UserStatus) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found!');
  }

  if (user.role === Role.ADMIN) {
    throw new Error('Cannot change status of another Admin user!');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updatedUser;
};

// Get all system bookings with filters
const getAllBookings = async (query: Record<string, any>) => {
  const { status, serviceId } = query;

  const whereConditions: Prisma.BookingWhereInput[] = [];

  if (status) {
    whereConditions.push({ status: status as BookingStatus });
  }

  if (serviceId) {
    whereConditions.push({ serviceId: String(serviceId) });
  }

  const where: Prisma.BookingWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      technicianProfile: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      service: {
        include: { category: true },
      },
      payment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings;
};

// Get all categories (Admin view includes service counts)
const getAllCategories = async () => {
  return await prisma.category.findMany({
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
};

// Create a new service category
const createCategory = async (payload: { name: string; description?: string; icon?: string }) => {
  const { name, description, icon } = payload;

  if (!name) {
    throw new Error('Category name is required!');
  }

  const existingCategory = await prisma.category.findUnique({
    where: { name },
  });

  if (existingCategory) {
    throw new Error('A category with this name already exists!');
  }

  const newCategory = await prisma.category.create({
    data: {
      name,
      description,
      icon,
    },
  });

  return newCategory;
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  getAllBookings,
  getAllCategories,
  createCategory,
};