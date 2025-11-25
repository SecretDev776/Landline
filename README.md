# Landline Shuttle Booking Widget

A fast, reliable, and high-conversion booking widget for shuttle services. Built with Next.js, TypeScript, Prisma, and Tailwind CSS.

##  Live Demo

https://landline-a8jgfxf0z-secretdev776-9261s-projects.vercel.app/

##  Features

- **Fast Search**: Find available trips by origin, destination, and date
- **Real-time Availability**: See actual seat availability for each trip
- **Multi-Passenger Booking**: Book for groups with ease
- **Concurrency Safe**: Optimistic locking prevents overselling
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Type-Safe**: Full TypeScript coverage from database to UI

##  Architecture

For a comprehensive overview of the architecture, database design, API structure, and concurrency handling, please see [ARCHITECTURE.md](./ARCHITECTURE.md).

### Key Design Decisions

1. **Database Schema**: Normalized design with Routes, Trips, TripInstances, Bookings, and Passengers
2. **Concurrency Control**: Optimistic locking with automatic retry for handling simultaneous bookings
3. **API Design**: RESTful endpoints with full validation and type safety
4. **User Experience**: Three-step booking flow optimized for conversion

##  Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **ORM**: Prisma
- **Validation**: Zod
- **Date Handling**: date-fns

##  Getting Started

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <https://github.com/SecretDev776/Landline>
cd landline

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma migrate dev

# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

##  Database Schema

The application uses a normalized database schema:

- **Route**: Physical routes between cities (e.g., SF → LA)
- **Trip**: Scheduled trips on routes (e.g., daily at 8:00 AM)
- **TripInstance**: Specific occurrences with seat inventory
- **Booking**: Customer reservations
- **Passenger**: Individual passenger details

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed schema documentation.

##  Concurrency Handling

The booking system uses **optimistic locking** to prevent overselling:

1. Each `TripInstance` has a `version` field
2. When booking, we check the version matches
3. If another booking modified it, we retry automatically
4. Maximum 3 retry attempts with small delays

This approach provides excellent performance while preventing race conditions.

##  API Endpoints

### POST /api/search
Search for available trips.

**Request**:
```json
{
  "origin": "San Francisco",
  "destination": "Los Angeles",
  "date": "2025-12-01"
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "trip_id",
      "tripInstanceId": "instance_id",
      "origin": "San Francisco",
      "destination": "Los Angeles",
      "date": "2025-12-01",
      "departureTime": "07:00",
      "arrivalTime": "15:30",
      "price": 49.00,
      "availableSeats": 45,
      "distance": 382
    }
  ]
}
```

### POST /api/booking
Create a new booking.

**Request**:
```json
{
  "tripInstanceId": "instance_id",
  "passengers": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "555-1234"
    }
  ],
  "contactEmail": "john@example.com",
  "contactPhone": "555-1234"
}
```

**Response**:
```json
{
  "success": true,
  "bookingRef": "A3K9M2",
  "message": "Booking confirmed! Your booking reference is A3K9M2"
}
```

##  Testing

```bash
# Run linter
npm run lint

# Run type checking
npx tsc --noEmit
```

##  Development Workflow

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma migrate dev --name <migration_name>

# Regenerate Prisma Client after schema changes
npx prisma generate

# Reseed database
npm run seed
```

## Project Structure

```
landline/
├── app/
│   ├── api/              # API routes
│   │   ├── search/
│   │   └── booking/
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main page
├── components/           # React components
│   ├── SearchForm.tsx
│   ├── TripResults.tsx
│   └── BookingForm.tsx
├── lib/                  # Utilities
│   ├── prisma.ts         # Prisma client
│   └── types.ts          # Shared types
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed script
│   └── migrations/       # Database migrations
├── ARCHITECTURE.md       # Architecture documentation
└── README.md            # This file
```

##  Known Limitations

1. **SQLite in Development**: Uses SQLite for easy setup. Switch to PostgreSQL for production.
2. **No Payment Integration**: Booking is free (payment integration is a future enhancement).
3. **No Email Notifications**: Confirmation emails not yet implemented.
4. **No User Authentication**: All bookings are anonymous.




