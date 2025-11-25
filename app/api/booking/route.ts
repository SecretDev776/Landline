import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bookingSchema, BookingResult } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


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

    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL environment variable is not set');
      return NextResponse.json(
        { 
          success: false,
          error: 'Database configuration error',
          details: 'DATABASE_URL environment variable is required. Please set it in Vercel environment variables.'
        },
        { status: 500 }
      );
    }

    console.log('Booking API called');
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body));
    
    const validation = bookingSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { tripInstanceId, passengers, contactEmail, contactPhone } = validation.data;
    console.log('Booking params:', { tripInstanceId, passengersCount: passengers.length });

    let retries = 3;
    let booking = null;

    while (retries > 0 && !booking) {
      try {
        booking = await prisma.$transaction(async (tx) => {
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

          if (updated.count === 0) {
            throw new Error('CONCURRENT_MODIFICATION');
          }

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

          const totalPrice = tripInstance.trip.basePrice * passengers.length;

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

        break;
      } catch (error: any) {
        if (error.message === 'CONCURRENT_MODIFICATION' && retries > 1) {
          retries--;
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
    const errorStack = error.stack || '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        type: error.constructor?.name || typeof error
      },
      { status: 500 }
    );
  }
}

