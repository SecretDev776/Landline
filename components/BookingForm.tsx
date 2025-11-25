'use client';

import { useState } from 'react';
import { TripResult, PassengerData } from '@/lib/types';
import { format } from 'date-fns';

interface BookingFormProps {
  trip: TripResult;
  onComplete: (bookingRef: string) => void;
}

export function BookingForm({ trip, onComplete }: BookingFormProps) {
  const [numPassengers, setNumPassengers] = useState(1);
  const [passengers, setPassengers] = useState<PassengerData[]>([
    { firstName: '', lastName: '', email: '', phone: '' },
  ]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleNumPassengersChange = (num: number) => {
    setNumPassengers(num);
    const newPassengers = [...passengers];
    
    if (num > passengers.length) {
      for (let i = passengers.length; i < num; i++) {
        newPassengers.push({ firstName: '', lastName: '', email: '', phone: '' });
      }
    } else {
      newPassengers.splice(num);
    }
    
    setPassengers(newPassengers);
  };

  const updatePassenger = (index: number, field: keyof PassengerData, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      for (let i = 0; i < passengers.length; i++) {
        if (!passengers[i].firstName || !passengers[i].lastName) {
          setError(`Please enter first and last name for passenger ${i + 1}`);
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripInstanceId: trip.tripInstanceId,
          passengers,
          contactEmail,
          contactPhone,
        }),
      });

      const data = await response.json();

      if (data.success && data.bookingRef) {
        onComplete(data.bookingRef);
      } else {
        setError(data.error || 'Booking failed. Please try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = trip.price * numPassengers;
  const formattedDate = format(new Date(trip.date), 'EEEE, MMMM d, yyyy');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Complete Your Booking
        </h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <span className="font-semibold">Route:</span> {trip.origin} → {trip.destination}
          </p>
          <p>
            <span className="font-semibold">Date:</span> {formattedDate}
          </p>
          <p>
            <span className="font-semibold">Departure:</span> {trip.departureTime}
          </p>
          <p>
            <span className="font-semibold">Arrival:</span> {trip.arrivalTime}
          </p>
          <p className="text-xl font-bold text-blue-600 mt-4">
            Total: ${totalPrice.toFixed(2)}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Passengers
        </label>
        <select
          value={numPassengers}
          onChange={(e) => handleNumPassengersChange(Number(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        >
          {[...Array(Math.min(10, trip.availableSeats))].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} {i === 0 ? 'Passenger' : 'Passengers'}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {passengers.map((passenger, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Passenger {index + 1}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={passenger.firstName}
                  onChange={(e) => updatePassenger(index, 'firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={passenger.lastName}
                  onChange={(e) => updatePassenger(index, 'lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={passenger.email}
                  onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={passenger.phone}
                  onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isSubmitting}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          We'll send your booking confirmation to this email address.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isSubmitting ? 'Processing...' : `Confirm Booking - $${totalPrice.toFixed(2)}`}
      </button>
    </form>
  );
}

