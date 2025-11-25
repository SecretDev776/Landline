import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bookingSchema, BookingResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate a unique booking reference
function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = bookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tripInstanceId, passengers, contactEmail, contactPhone } = validation.data;

    // Use a transaction with retry logic for concurrency handling
    let retries = 3;
    let booking = null;

    while (retries > 0 && !booking) {
      try {
        // Perform the booking in a transaction with optimistic locking
        booking = await prisma.$transaction(async (tx) => {
          // Lock the trip instance and check availability
          const tripInstance = await tx.tripInstance.findUnique({
            where: { id: tripInstanceId },
            include: {
              trip: {
                include: {
                  route: true,
                },
              },
            },
          });

          if (!tripInstance) {
            throw new Error('Trip not found');
          }

          if (tripInstance.status !== 'active') {
            throw new Error('Trip is no longer available');
          }

          if (tripInstance.availableSeats < passengers.length) {
            throw new Error(`Only ${tripInstance.availableSeats} seats available`);
          }

          // Update available seats with optimistic locking
          const updated = await tx.tripInstance.updateMany({
            where: {
              id: tripInstanceId,
              version: tripInstance.version,
            },
            data: {
              availableSeats: tripInstance.availableSeats - passengers.length,
              version: tripInstance.version + 1,
            },
          });

          // If no rows were updated, it means another transaction modified it
          if (updated.count === 0) {
            throw new Error('CONCURRENT_MODIFICATION');
          }

          // Generate unique booking reference
          let bookingRef = generateBookingRef();
          let attempts = 0;
          while (attempts < 10) {
            const existing = await tx.booking.findUnique({
              where: { bookingRef },
            });
            if (!existing) break;
            bookingRef = generateBookingRef();
            attempts++;
          }

          // Calculate total price
          const totalPrice = tripInstance.trip.basePrice * passengers.length;

          // Create booking
          const newBooking = await tx.booking.create({
            data: {
              tripInstanceId,
              bookingRef,
              status: 'confirmed',
              totalPrice,
              contactEmail,
              contactPhone,
              passengers: {
                create: passengers.map((p) => ({
                  firstName: p.firstName,
                  lastName: p.lastName,
                  email: p.email || null,
                  phone: p.phone || null,
                })),
              },
            },
            include: {
              passengers: true,
            },
          });

          return newBooking;
        });

        // If we get here, booking succeeded
        break;
      } catch (error: any) {
        if (error.message === 'CONCURRENT_MODIFICATION' && retries > 1) {
          // Retry on concurrent modification
          retries--;
          // Small delay before retry
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }
        throw error;
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Unable to complete booking. Please try again.' },
        { status: 409 }
      );
    }

    const result: BookingResult = {
      success: true,
      bookingRef: booking.bookingRef,
      message: `Booking confirmed! Your booking reference is ${booking.bookingRef}`,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Booking error:', error);
    
    const errorMessage = error.message || 'Internal server error';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

