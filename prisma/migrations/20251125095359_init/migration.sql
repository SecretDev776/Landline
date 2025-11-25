-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "basePrice" REAL NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 55,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TripInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TripInstance_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripInstanceId" TEXT NOT NULL,
    "bookingRef" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "totalPrice" REAL NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "cancelledAt" DATETIME,
    CONSTRAINT "Booking_tripInstanceId_fkey" FOREIGN KEY ("tripInstanceId") REFERENCES "TripInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Passenger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Route_origin_idx" ON "Route"("origin");

-- CreateIndex
CREATE INDEX "Route_destination_idx" ON "Route"("destination");

-- CreateIndex
CREATE UNIQUE INDEX "Route_origin_destination_key" ON "Route"("origin", "destination");

-- CreateIndex
CREATE INDEX "Trip_routeId_idx" ON "Trip"("routeId");

-- CreateIndex
CREATE INDEX "TripInstance_tripId_idx" ON "TripInstance"("tripId");

-- CreateIndex
CREATE INDEX "TripInstance_date_idx" ON "TripInstance"("date");

-- CreateIndex
CREATE INDEX "TripInstance_status_idx" ON "TripInstance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TripInstance_tripId_date_key" ON "TripInstance"("tripId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingRef_key" ON "Booking"("bookingRef");

-- CreateIndex
CREATE INDEX "Booking_tripInstanceId_idx" ON "Booking"("tripInstanceId");

-- CreateIndex
CREATE INDEX "Booking_bookingRef_idx" ON "Booking"("bookingRef");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_contactEmail_idx" ON "Booking"("contactEmail");

-- CreateIndex
CREATE INDEX "Passenger_bookingId_idx" ON "Passenger"("bookingId");
