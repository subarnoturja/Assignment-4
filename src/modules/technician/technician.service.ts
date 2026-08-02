import { Prisma } from "../../../generated/prisma/browser";
import { prisma } from "../../lib/prisma";


const getAllTechnicians = async (query: Record<string, any>) => {
  const { location, skill, minRating, maxHourlyRate, search } = query;

  const whereConditions: Prisma.TechnicianProfileWhereInput[] = [];

  // Filter out banned technicians
  whereConditions.push({
    user: {
      status: 'ACTIVE',
    },
  });

  // Filter by location
  if (location) {
    whereConditions.push({
      location: { contains: String(location), mode: 'insensitive' },
    });
  }

  // Filter by specific skill
  if (skill) {
    whereConditions.push({
      skills: { has: String(skill) },
    });
  }

  // Filter by minimum rating
  if (minRating) {
    whereConditions.push({
      rating: { gte: parseFloat(String(minRating)) },
    });
  }

  // Filter by max hourly rate
  if (maxHourlyRate) {
    whereConditions.push({
      hourlyRate: { lte: parseFloat(String(maxHourlyRate)) },
    });
  }

  // Search technician by name or bio keyword
  if (search) {
    whereConditions.push({
      OR: [
        { bio: { contains: String(search), mode: 'insensitive' } },
        { user: { name: { contains: String(search), mode: 'insensitive' } } },
      ],
    });
  }

  const where: Prisma.TechnicianProfileWhereInput = { AND: whereConditions };

  const technicians = await prisma.technicianProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      services: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      rating: 'desc',
    },
  });

  return technicians;
};

const getTechnicianById = async (id: string) => {
  const technician = await prisma.technicianProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      services: {
        include: {
          category: true,
        },
      },
      reviews: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!technician) {
    throw new Error('Technician profile not found!');
  }

  return technician;
};

export const TechnicianService = {
  getAllTechnicians,
  getTechnicianById,
};