import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data using raw SQL with CASCADE for PostgreSQL
  console.log('Clearing existing data...');
  
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "Passenger", "Booking", "TripInstance", "Trip", "Route" RESTART IDENTITY CASCADE`;
    console.log('Existing data cleared with TRUNCATE CASCADE.');
  } catch (error) {
    // If TRUNCATE fails (e.g., tables don't exist), use deleteMany
    console.log('TRUNCATE failed, using deleteMany instead...');
    await prisma.passenger.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.tripInstance.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.route.deleteMany();
    console.log('Existing data cleared with deleteMany.');
  }

  console.log('Creating routes...');
  
  // Create routes based on real Landline routes
  const routes = [
    {
      origin: 'San Francisco',
      destination: 'Los Angeles',
      distance: 382,
    },
    {
      origin: 'Los Angeles',
      destination: 'San Francisco',
      distance: 382,
    },
    {
      origin: 'Oakland',
      destination: 'Los Angeles',
      distance: 370,
    },
    {
      origin: 'Los Angeles',
      destination: 'Oakland',
      distance: 370,
    },
    {
      origin: 'San Francisco',
      destination: 'Santa Barbara',
      distance: 330,
    },
    {
      origin: 'Santa Barbara',
      destination: 'San Francisco',
      distance: 330,
    },
  ];

  const createdRoutes = await Promise.all(
    routes.map((route) =>
      prisma.route.create({
        data: route,
      })
    )
  );

  console.log('Creating trips...');

  // Create trips with realistic schedules
  const trips = [
    // San Francisco to Los Angeles
    {
      routeId: createdRoutes[0].id,
      departureTime: '07:00',
      arrivalTime: '15:30',
      daysOfWeek: '0,1,2,3,4,5,6', // Every day
      basePrice: 49.00,
      capacity: 55,
    },
    {
      routeId: createdRoutes[0].id,
      departureTime: '11:00',
      arrivalTime: '19:30',
      daysOfWeek: '0,1,2,3,4,5,6',
      basePrice: 49.00,
      capacity: 55,
    },
    {
      routeId: createdRoutes[0].id,
      departureTime: '15:00',
      arrivalTime: '23:30',
      daysOfWeek: '4,5,6', // Friday, Saturday, Sunday
      basePrice: 69.00,
      capacity: 55,
    },
    // Los Angeles to San Francisco
    {
      routeId: createdRoutes[1].id,
      departureTime: '08:00',
      arrivalTime: '16:30',
      daysOfWeek: '0,1,2,3,4,5,6',
      basePrice: 49.00,
      capacity: 55,
    },
    {
      routeId: createdRoutes[1].id,
      departureTime: '13:00',
      arrivalTime: '21:30',
      daysOfWeek: '0,1,2,3,4,5,6',
      basePrice: 49.00,
      capacity: 55,
    },
    {
      routeId: createdRoutes[1].id,
      departureTime: '17:00',
      arrivalTime: '01:30',
      daysOfWeek: '5,6', // Saturday, Sunday
      basePrice: 69.00,
      capacity: 55,
    },
    // Oakland to Los Angeles
    {
      routeId: createdRoutes[2].id,
      departureTime: '08:30',
      arrivalTime: '17:00',
      daysOfWeek: '1,2,3,4,5', // Weekdays
      basePrice: 45.00,
      capacity: 55,
    },
    {
      routeId: createdRoutes[2].id,
      departureTime: '14:00',
      arrivalTime: '22:30',
      daysOfWeek: '0,6', // Sunday, Saturday
      basePrice: 59.00,
      capacity: 55,
    },
    // Los Angeles to Oakland
    {
      routeId: createdRoutes[3].id,
      departureTime: '09:00',
      arrivalTime: '17:30',
      daysOfWeek: '1,2,3,4,5',
      basePrice: 45.00,
      capacity: 55,
    },
    {
      routeId: createdRoutes[3].id,
      departureTime: '16:00',
      arrivalTime: '00:30',
      daysOfWeek: '0,6',
      basePrice: 59.00,
      capacity: 55,
    },
    // San Francisco to Santa Barbara
    {
      routeId: createdRoutes[4].id,
      departureTime: '10:00',
      arrivalTime: '17:00',
      daysOfWeek: '0,3,5', // Sunday, Wednesday, Friday
      basePrice: 55.00,
      capacity: 55,
    },
    // Santa Barbara to San Francisco
    {
      routeId: createdRoutes[5].id,
      departureTime: '11:00',
      arrivalTime: '18:00',
      daysOfWeek: '1,4,6', // Monday, Thursday, Saturday
      basePrice: 55.00,
      capacity: 55,
    },
  ];

  const createdTrips = await Promise.all(
    trips.map((trip) =>
      prisma.trip.create({
        data: trip,
      })
    )
  );

  console.log('Creating trip instances for the next 30 days...');

  // Create trip instances for the next 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay().toString();

    for (const trip of createdTrips) {
      const daysArray = trip.daysOfWeek.split(',');
      
      if (daysArray.includes(dayOfWeek)) {
        // Randomize available seats slightly for realism
        const randomSeatReduction = Math.floor(Math.random() * 10);
        const availableSeats = trip.capacity - randomSeatReduction;

        await prisma.tripInstance.create({
          data: {
            tripId: trip.id,
            date: date,
            availableSeats: availableSeats,
            status: 'active',
          },
        });
      }
    }
  }

  console.log('Seed completed successfully!');
  console.log(`Created ${createdRoutes.length} routes`);
  console.log(`Created ${createdTrips.length} trips`);
  
  const instanceCount = await prisma.tripInstance.count();
  console.log(`Created ${instanceCount} trip instances`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

