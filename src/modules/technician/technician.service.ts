
import { BookingStatus, Prisma } from "../../../generated/prisma/client";
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

const getProfileByUserId = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    throw new Error('Technician profile not found!');
  }
  return profile;
};

const updateProfile = async (userId: string, payload: any) => {
  const profile = await getProfileByUserId(userId);
  const { bio, skills, hourlyRate, location, experienceYears } = payload;

  const updatedProfile = await prisma.technicianProfile.update({
    where: { id: profile.id },
    data: {
      ...(bio !== undefined && { bio }),
      ...(skills !== undefined && { skills }),
      ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
      ...(location !== undefined && { location }),
      ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears) }),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  return updatedProfile;
};

const updateAvailability = async (userId: string, payload: { availability: any }) => {
  const profile = await getProfileByUserId(userId);

  if (!payload.availability) {
    throw new Error('Availability data is required!');
  }

  const updatedProfile = await prisma.technicianProfile.update({
    where: { id: profile.id },
    data: {
      availability: payload.availability,
    },
  });

  return updatedProfile;
};

const getTechnicianBookings = async (userId: string, query: Record<string, any>) => {
  const profile = await getProfileByUserId(userId);
  const { status } = query;

  const whereConditions: Prisma.BookingWhereInput = {
    technicianProfileId: profile.id,
  };

  if (status) {
    whereConditions.status = status as BookingStatus;
  }

  const bookings = await prisma.booking.findMany({
    where: whereConditions,
    include: {
      service: {
        include: {
          category: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payment: true,
      review: true,
    },
    orderBy: {
      scheduledAt: 'desc',
    },
  });

  return bookings;
};

const updateBookingStatus = async (
  userId: string,
  bookingId: string,
  newStatus: BookingStatus
) => {
  const profile = await getProfileByUserId(userId);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error('Booking not found!');
  }

  if (booking.technicianProfileId !== profile.id) {
    throw new Error('Unauthorized access to this booking!');
  }

  // Allowed statuses: ACCEPTED, DECLINED, COMPLETED, CANCELLED
  const allowedStatuses: BookingStatus[] = [
    BookingStatus.ACCEPTED,
    BookingStatus.DECLINED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ];

  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Invalid status transition to ${newStatus}!`);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
    include: {
      service: true,
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      payment: true,
    },
  });

  return updatedBooking;
};

export const TechnicianService = {
  getAllTechnicians,
  getTechnicianById,
  updateProfile,
  updateAvailability,
  getTechnicianBookings,
  updateBookingStatus,
};