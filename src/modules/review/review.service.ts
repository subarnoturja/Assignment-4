import { BookingStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";


const createReview = async (
  customerId: string,
  payload: { bookingId: string; rating: number; comment?: string }
) => {
  const { bookingId, rating, comment } = payload;

  if (!bookingId || !rating) {
    throw new Error('bookingId and rating are required fields!');
  }

  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5!');
  }

  // 1. Verify booking exists and belongs to the customer
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });

  if (!booking) {
    throw new Error('Booking not found!');
  }

  if (booking.customerId !== customerId) {
    throw new Error('You are not authorized to review this booking!');
  }

  // 2. Ensure job status is COMPLETED
  if (booking.status !== BookingStatus.COMPLETED) {
    throw new Error('You can only review completed jobs!');
  }

  // 3. Prevent duplicate reviews for the same booking
  if (booking.review) {
    throw new Error('A review has already been submitted for this booking!');
  }

  // 4. Create review and recalculate technician average rating in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const createdReview = await tx.review.create({
      data: {
        bookingId,
        customerId,
        technicianProfileId: booking.technicianProfileId,
        rating: Number(rating),
        comment,
      },
      include: {
        customer: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate updated average rating for technician
    const aggregate = await tx.review.aggregate({
      where: { technicianProfileId: booking.technicianProfileId },
      _avg: { rating: true },
    });

    const newAverageRating = aggregate._avg.rating || 0;

    // Update technician profile with the new rating
    await tx.technicianProfile.update({
      where: { id: booking.technicianProfileId },
      data: {
        rating: parseFloat(newAverageRating.toFixed(2)),
      },
    });

    return createdReview;
  });

  return result;
};

export const ReviewService = {
  createReview,
};