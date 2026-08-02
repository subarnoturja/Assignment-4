import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";


const getAllServices = async (query: Record<string, any>) => {
  const { categoryId, location, minPrice, maxPrice, minRating, search } = query;

  const whereConditions: Prisma.ServiceWhereInput[] = [];

  // Filter by category ID or name keyword
  if (categoryId) {
    whereConditions.push({ categoryId: String(categoryId) });
  }

  // Search by keyword in service title or description
  if (search) {
    whereConditions.push({
      OR: [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ],
    });
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    whereConditions.push({
      price: {
        gte: minPrice ? parseFloat(String(minPrice)) : undefined,
        lte: maxPrice ? parseFloat(String(maxPrice)) : undefined,
      },
    });
  }

  // Filter by technician location or rating
  if (location || minRating) {
    whereConditions.push({
      technicianProfile: {
        location: location
          ? { contains: String(location), mode: 'insensitive' }
          : undefined,
        rating: minRating ? { gte: parseFloat(String(minRating)) } : undefined,
      },
    });
  }

  const where: Prisma.ServiceWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  const services = await prisma.service.findMany({
    where,
    include: {
      category: true,
      technicianProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return services;
};

export const ServiceService = {
  getAllServices,
};