import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { searchSchema, TripResult } from '@/lib/types';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Validate DATABASE_URL at runtime
    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Database configuration error',
          details: 'DATABASE_URL environment variable is required. Please set it in Vercel environment variables.'
        },
        { status: 500 }
      );
    }

    // Log incoming request for debugging in production
    console.log('Search API called');
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body));
    
    // Validate request
    const validation = searchSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation failed:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { origin, destination, date } = validation.data;
    console.log('Search params:', { origin, destination, date });

    // Parse and validate date
    const searchDate = new Date(date);
    const dayStart = startOfDay(searchDate);
    const dayEnd = endOfDay(searchDate);
    console.log('Date range:', { dayStart, dayEnd });

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw new Error(`Database connection error: ${dbError instanceof Error ? dbError.message : 'Unknown'}`);
    }

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

    console.log('Querying routes...');
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
    console.log(`Found ${routes.length} routes`);

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
    
    console.log(`Returning ${results.length} trip results`);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}

