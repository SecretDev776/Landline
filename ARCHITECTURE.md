# Landline Shuttle Booking Widget - Architecture & Data Design

## Overview

This document provides a comprehensive overview of the architectural decisions, database design, API structure, and concurrency handling for the Landline shuttle booking widget.

## 1. Database Schema

### Technology Choice
- **Database**: SQLite (for development/demo) with Prisma ORM
- **Production Ready**: Schema is designed to work with PostgreSQL with minimal changes
- **ORM**: Prisma for type-safe database operations and automatic migrations

### Core Data Models

#### 1.1 Route
Represents the physical route between two cities.

```prisma
model Route {
  id          String   @id @default(cuid())
  origin      String
  destination String
  distance    Int      // in miles
  trips       Trip[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([origin, destination])
  @@index([origin])
  @@index([destination])
}
```

**Design Rationale**:
- Separates static route information from dynamic schedules
- Unique constraint on origin+destination prevents duplicate routes
- Indexes on origin/destination for fast search queries
- One-to-many relationship with trips allows multiple schedules per route

#### 1.2 Trip
Represents a scheduled trip on a route (e.g., "SF to LA, Mondays at 8:00 AM").

```prisma
model Trip {
  id            String         @id @default(cuid())
  routeId       String
  route         Route          @relation(fields: [routeId], references: [id])
  departureTime String         // HH:mm format
  arrivalTime   String         // HH:mm format
  daysOfWeek    String         // Comma-separated: "0,1,2,3,4"
  basePrice     Float
  capacity      Int            @default(55)
  tripInstances TripInstance[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}
```

**Design Rationale**:
- Stores schedule templates that repeat weekly
- `daysOfWeek` uses CSV format for flexibility (0=Sunday, 6=Saturday)
- `basePrice` and `capacity` are defaults for generating trip instances
- Allows easy modification of recurring schedules
- One-to-many with TripInstance for actual bookable trips

#### 1.3 TripInstance
Represents a specific occurrence of a trip on a particular date with seat inventory.

```prisma
model TripInstance {
  id              String    @id @default(cuid())
  tripId          String
  trip            Trip      @relation(fields: [tripId], references: [id])
  date            DateTime
  availableSeats  Int
  version         Int       @default(0)  // Optimistic locking
  status          String    @default("active")
  bookings        Booking[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([tripId, date])
  @@index([tripId])
  @@index([date])
  @@index([status])
}
```

**Design Rationale**:
- Separates actual bookable inventory from schedule templates
- `version` field enables optimistic locking for concurrency control
- `status` allows for trip cancellations or modifications
- Unique constraint on tripId+date prevents duplicate instances
- Indexes optimize search queries by date and status
- Pre-generated instances provide fast search and clear inventory visibility

#### 1.4 Booking
Represents a customer reservation.

```prisma
model Booking {
  id             String       @id @default(cuid())
  tripInstanceId String
  tripInstance   TripInstance @relation(fields: [tripInstanceId], references: [id])
  bookingRef     String       @unique
  status         String       @default("confirmed")
  totalPrice     Float
  passengers     Passenger[]
  contactEmail   String
  contactPhone   String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  cancelledAt    DateTime?
  
  @@index([tripInstanceId])
  @@index([bookingRef])
  @@index([status])
  @@index([contactEmail])
}
```

**Design Rationale**:
- `bookingRef` provides user-friendly booking reference (6-char alphanumeric)
- `status` enables booking lifecycle management (confirmed, cancelled, modified)
- `cancelledAt` tracks cancellation timestamp for analytics
- Indexes support quick lookup by reference and email
- One-to-many with Passenger allows group bookings

#### 1.5 Passenger
Stores individual passenger details.

```prisma
model Passenger {
  id        String   @id @default(cuid())
  bookingId String
  booking   Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  firstName String
  lastName  String
  email     String?
  phone     String?
  createdAt DateTime @default(now())
}
```

**Design Rationale**:
- Separate table allows multiple passengers per booking
- Optional email/phone per passenger for flexibility
- Cascade delete ensures data integrity when booking is cancelled
- Minimal required fields reduce booking friction

### Handling Modifications and Cancellations

#### Cancellations
```typescript
// Cancellation process:
1. Update booking status to "cancelled"
2. Set cancelledAt timestamp
3. Increment TripInstance.availableSeats
4. Increment TripInstance.version (for audit trail)
```

#### Modifications
```typescript
// Modification strategies:
Option A: Create new booking + cancel old booking
Option B: Update existing booking (for minor changes)

For date/trip changes:
1. Check availability on new trip
2. Create new booking
3. Cancel original booking atomically
```

### Scalability Considerations

1. **Partitioning**: TripInstance can be partitioned by date for historical data
2. **Archiving**: Move completed trips to archive tables after 30 days
3. **Indexing**: All foreign keys and search fields are indexed
4. **Denormalization**: Trip details cached in search results to reduce joins
5. **Read Replicas**: Read-heavy search queries can use replicas

## 2. API Structure

### Technology Stack
- **Framework**: Next.js 14+ App Router with API Routes
- **Validation**: Zod schemas for request validation
- **Type Safety**: TypeScript throughout
- **Database**: Prisma Client for type-safe queries

### API Endpoints

#### 2.1 POST /api/search
Search for available trips.

**Request**:
```typescript
{
  origin: string;      // City name
  destination: string; // City name
  date: string;        // ISO date string (YYYY-MM-DD)
}
```

**Response**:
```typescript
{
  results: TripResult[];
}

interface TripResult {
  id: string;              // Trip ID
  tripInstanceId: string;  // Specific instance ID for booking
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  distance: number;
}
```

**Implementation Details**:
- Uses case-insensitive search with LIKE operator
- Filters by date range (start/end of day)
- Only returns active trips with available seats
- Results sorted by departure time
- Query optimization with strategic includes

#### 2.2 POST /api/booking
Create a new booking.

**Request**:
```typescript
{
  tripInstanceId: string;
  passengers: Array<{
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  }>;
  contactEmail: string;
  contactPhone: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  bookingRef?: string;  // e.g., "A3K9M2"
  message?: string;
  error?: string;
}
```

**Implementation Details**:
- Full request validation with Zod
- Transactional booking with optimistic locking
- Automatic retry on concurrent modification
- Generates unique 6-character booking reference
- Atomic seat inventory updates

### Error Handling

All API endpoints follow a consistent error format:

```typescript
{
  error: string;        // Human-readable error message
  details?: any;        // Additional error details
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Invalid request (validation errors)
- `404`: Resource not found
- `409`: Conflict (e.g., no seats available, concurrent modification)
- `500`: Internal server error

### API Design Principles

1. **RESTful**: Clear, predictable endpoint structure
2. **Validated**: All inputs validated with Zod schemas
3. **Type-Safe**: Full TypeScript typing from DB to API
4. **Error-Friendly**: Clear error messages for debugging and UX
5. **Performant**: Optimized queries with minimal data transfer

## 3. Concurrency Control

### The Problem
Multiple users booking the same trip simultaneously could lead to:
- Overselling (selling more seats than available)
- Race conditions (concurrent updates)
- Data inconsistency

### Solution: Optimistic Locking with Retry

#### 3.1 Optimistic Locking Implementation

```typescript
// TripInstance includes a version field
version: Int @default(0)

// Booking transaction with version check
const updated = await tx.tripInstance.updateMany({
  where: {
    id: tripInstanceId,
    version: currentVersion,  // Only update if version matches
  },
  data: {
    availableSeats: currentSeats - numPassengers,
    version: currentVersion + 1,  // Increment version
  },
});

if (updated.count === 0) {
  // Another transaction modified this record
  throw new Error('CONCURRENT_MODIFICATION');
}
```

#### 3.2 Why Optimistic Locking?

**Advantages**:
- No database locks required
- Better performance under normal load
- Prevents overselling without blocking reads
- Works well with horizontal scaling

**Trade-offs**:
- Requires retry logic
- Slightly more complex application code
- May have higher retry rates under extreme load

**Alternatives Considered**:
1. **Pessimistic Locking**: `SELECT ... FOR UPDATE`
   - Pro: Guarantees no conflicts
   - Con: Blocks concurrent reads, reduces throughput
   
2. **Queue-Based**: Serialize all bookings through a queue
   - Pro: No conflicts possible
   - Con: Adds complexity, potential bottleneck, requires additional infrastructure

3. **Distributed Locks**: Redis-based locks
   - Pro: Works across multiple servers
   - Con: Additional infrastructure, single point of failure

**Decision**: Optimistic locking provides the best balance of simplicity, performance, and reliability for a shuttle booking system.

#### 3.3 Retry Logic

```typescript
let retries = 3;
let booking = null;

while (retries > 0 && !booking) {
  try {
    booking = await performBookingTransaction();
    break;
  } catch (error) {
    if (error.message === 'CONCURRENT_MODIFICATION' && retries > 1) {
      retries--;
      await delay(100); // Small delay before retry
      continue;
    }
    throw error; // Give up or different error
  }
}
```

**Retry Strategy**:
- Maximum 3 attempts per booking
- 100ms delay between retries
- Exponential backoff could be added for high-load scenarios

#### 3.4 Transaction Isolation

All booking operations use Prisma transactions:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Check availability
  // 2. Update seat count with version check
  // 3. Create booking
  // 4. Create passengers
});
```

**Benefits**:
- All-or-nothing: Either complete booking succeeds or nothing changes
- Consistent reads within transaction
- Automatic rollback on errors

### Concurrency Performance

**Expected Behavior**:
- Under normal load: <1% conflict rate
- High load (100+ concurrent bookings): 5-10% conflict rate
- Retry success rate: >95% on first retry

**Monitoring**:
- Track conflict rate
- Monitor retry attempts
- Alert on booking failures

### Future Enhancements

For extremely high traffic:
1. **Read Replicas**: Offload search queries
2. **Caching**: Cache route/trip data with short TTL
3. **Sharding**: Partition by date or route
4. **Event Sourcing**: Store all booking attempts as events

## 4. Frontend Architecture

### Technology
- **Framework**: Next.js 14 with App Router
- **UI**: React with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **State**: React hooks (useState) - simple enough to not need Redux
- **Date Handling**: date-fns for formatting and parsing

### Component Structure

```
app/
├── page.tsx              # Main orchestrator component
├── layout.tsx            # Root layout
├── api/                  # API routes
│   ├── search/route.ts
│   └── booking/route.ts
└── components/
    ├── SearchForm.tsx    # Origin, destination, date selection
    ├── TripResults.tsx   # Display available trips
    └── BookingForm.tsx   # Passenger details and confirmation
```

### User Flow

1. **Search** → User selects origin, destination, date
2. **Results** → Display available trips sorted by time
3. **Booking** → Collect passenger and contact details
4. **Confirmation** → Show booking reference

### UX Optimizations

1. **Fast Load**: Minimal bundle size, server-side rendering
2. **Clear Errors**: Inline validation with helpful messages
3. **Loading States**: Disabled buttons and loading indicators
4. **Responsive**: Mobile-first design with Tailwind
5. **Accessibility**: Semantic HTML, keyboard navigation, ARIA labels

## 5. Deployment Considerations

### Environment Requirements
- **Node.js**: 18+ (for production)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Platform**: Vercel, Railway, or similar

### Environment Variables
```
DATABASE_URL="postgresql://neondb_owner:npg_jO4uh6SaGBpZ@ep-ancient-band-af4xjgks-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
NODE_ENV=production
```

### Database Migration Strategy

**Development**:
```bash
npx prisma migrate dev --name <migration_name>
```

**Production**:
```bash
npx prisma migrate deploy
```

