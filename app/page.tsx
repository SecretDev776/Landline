'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { TripResults } from '@/components/TripResults';
import { BookingForm } from '@/components/BookingForm';
import { TripResult } from '@/lib/types';

type Step = 'search' | 'results' | 'booking' | 'confirmation';

export default function Home() {
  const [step, setStep] = useState<Step>('search');
  const [searchResults, setSearchResults] = useState<TripResult[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripResult | null>(null);
  const [bookingRef, setBookingRef] = useState<string>('');
  const [searchParams, setSearchParams] = useState({ origin: '', destination: '', date: '' });

  const handleSearch = async (origin: string, destination: string, date: string) => {
    setSearchParams({ origin, destination, date });
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, date }),
      });

      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
        setStep('results');
      } else {
        alert('No trips found for your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('An error occurred while searching. Please try again.');
    }
  };

  const handleSelectTrip = (trip: TripResult) => {
    setSelectedTrip(trip);
    setStep('booking');
  };

  const handleBookingComplete = (ref: string) => {
    setBookingRef(ref);
    setStep('confirmation');
  };

  const handleReset = () => {
    setStep('search');
    setSearchResults([]);
    setSelectedTrip(null);
    setBookingRef('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Landline Shuttle Booking
          </h1>
          <p className="text-gray-600">Fast, reliable shuttle service</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'search' && (
            <SearchForm onSearch={handleSearch} />
          )}

          {step === 'results' && (
            <div>
              <button
                onClick={() => setStep('search')}
                className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                ← Back to search
              </button>
              <TripResults
                results={searchResults}
                onSelectTrip={handleSelectTrip}
                searchParams={searchParams}
              />
            </div>
          )}

          {step === 'booking' && selectedTrip && (
            <div>
              <button
                onClick={() => setStep('results')}
                className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                ← Back to results
              </button>
              <BookingForm
                trip={selectedTrip}
                onComplete={handleBookingComplete}
              />
            </div>
          )}

          {step === 'confirmation' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Booking Confirmed!
              </h2>
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <p className="text-gray-700 mb-2">Your booking reference:</p>
                <p className="text-3xl font-bold text-blue-600">{bookingRef}</p>
              </div>
              <p className="text-gray-600 mb-8">
                A confirmation email has been sent to your email address.
                <br />
                Please save your booking reference for check-in.
              </p>
              <button
                onClick={handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Book Another Trip
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© 2025 Landline. Fast, reliable shuttle service.</p>
        </div>
      </div>
    </main>
  );
}
