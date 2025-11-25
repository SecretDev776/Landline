import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchSchema, TripResult } from '@/lib/types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { origin, destination, date } = validation.data;

    // Parse and validate date
    const searchDate = new Date(date);
    const dayStart = startOfDay(searchDate);
    const dayEnd = endOfDay(searchDate);

    // Find routes matching origin and destination
    // Using type assertion to work around Prisma 4.x type limitation with mode: 'insensitive'
    const whereClause: Prisma.RouteWhereInput = {
      origin: {
        contains: origin,
        mode: 'insensitive',
      } as Prisma.StringFilter,
      destination: {
        contains: destination,
        mode: 'insensitive',
      } as Prisma.StringFilter,
    };

    const routes = await prisma.route.findMany({
      where: whereClause,
      include: {
        trips: {
          include: {
            tripInstances: {
              where: {
                date: {
                  gte: dayStart,
                  lte: dayEnd,
                },
                status: 'active',
                availableSeats: {
                  gt: 0,
                },
              },
            },
          },
        },
      },
    });

    // Transform results
    const results: TripResult[] = [];

    for (const route of routes) {
      for (const trip of route.trips) {
        for (const instance of trip.tripInstances) {
          results.push({
            id: trip.id,
            tripInstanceId: instance.id,
            origin: route.origin,
            destination: route.destination,
            date: format(instance.date, 'yyyy-MM-dd'),
            departureTime: trip.departureTime,
            arrivalTime: trip.arrivalTime,
            price: trip.basePrice,
            availableSeats: instance.availableSeats,
            distance: route.distance,
          });
        }
      }
    }

    // Sort by departure time
    results.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

