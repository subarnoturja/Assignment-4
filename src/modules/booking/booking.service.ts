import { BookingStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";


const createBooking = async (customerId: string, payload: any) => {
  const { serviceId, scheduledAt } = payload;

  if (!serviceId || !scheduledAt) {
    throw new Error('serviceId and scheduledAt are required fields!');
  }

  // Validate service existence along with technician profile
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      technicianProfile: true,
    },
  });

  if (!service) {
    throw new Error('Requested service not found!');
  }

  const booking = await prisma.booking.create({
    data: {
      customerId,
      technicianProfileId: service.technicianProfileId,
      serviceId,
      scheduledAt: new Date(scheduledAt),
      totalAmount: service.price,
      status: BookingStatus.REQUESTED,
    },
    include: {
      service: true,
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
  });

  return booking;
};

const getUserBookings = async (userId: string, role: Role) => {
  let whereCondition = {};

  if (role === Role.CUSTOMER) {
    whereCondition = { customerId: userId };
  } else if (role === Role.TECHNICIAN) {
    // Technician profile is linked via userId
    const techProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });

    if (!techProfile) {
      throw new Error('Technician profile not found!');
    }

    whereCondition = { technicianProfileId: techProfile.id };
  }
  // ADMIN can view all bookings if whereCondition remains empty

  const bookings = await prisma.booking.findMany({
    where: whereCondition,
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
      payment: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return bookings;
};

const getBookingById = async (bookingId: string, userId: string, role: Role) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
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
      payment: true,
      review: true,
    },
  });

  if (!booking) {
    throw new Error('Booking not found!');
  }

  // Authorize access: Only owner customer, booked technician, or admin can access
  if (role === Role.CUSTOMER && booking.customerId !== userId) {
    throw new Error('Unauthorized access to this booking!');
  }

  if (role === Role.TECHNICIAN) {
    const techProfile = await prisma.technicianProfile.findUnique({
      where: { userId },
    });

    if (!techProfile || booking.technicianProfileId !== techProfile.id) {
      throw new Error('Unauthorized access to this booking!');
    }
  }

  return booking;
};

export const BookingService = {
  createBooking,
  getUserBookings,
  getBookingById,
};