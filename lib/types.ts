import { z } from 'zod';

// Search request schema
export const searchSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
});

export type SearchRequest = z.infer<typeof searchSchema>;

// Booking request schema
export const passengerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export const bookingSchema = z.object({
  tripInstanceId: z.string().min(1, 'Trip instance ID is required'),
  passengers: z.array(passengerSchema).min(1, 'At least one passenger is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
});

export type BookingRequest = z.infer<typeof bookingSchema>;
export type PassengerData = z.infer<typeof passengerSchema>;

// API response types
export interface TripResult {
  id: string;
  tripInstanceId: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  distance: number;
}

export interface BookingResult {
  success: boolean;
  bookingRef?: string;
  message?: string;
  error?: string;
}

