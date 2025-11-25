'use client';

import { TripResult } from '@/lib/types';
import { format } from 'date-fns';

interface TripResultsProps {
  results: TripResult[];
  onSelectTrip: (trip: TripResult) => void;
  searchParams: { origin: string; destination: string; date: string };
}

export function TripResults({ results, onSelectTrip, searchParams }: TripResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No trips found
        </h3>
        <p className="text-gray-600">
          Try searching for a different date or route.
        </p>
      </div>
    );
  }

  const formattedDate = format(new Date(searchParams.date), 'EEEE, MMMM d, yyyy');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Available Trips
        </h2>
        <p className="text-gray-600">
          {searchParams.origin} → {searchParams.destination} on {formattedDate}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {results.length} {results.length === 1 ? 'trip' : 'trips'} available
        </p>
      </div>

      <div className="space-y-4">
        {results.map((trip) => (
          <div
            key={trip.tripInstanceId}
            className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {trip.departureTime}
                    </div>
                    <div className="text-sm text-gray-500">Depart</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-1 border-t-2 border-gray-300"></div>
                      <div className="px-2 text-gray-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 border-t-2 border-gray-300"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {trip.arrivalTime}
                    </div>
                    <div className="text-sm text-gray-500">Arrive</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {trip.distance} miles
                  </span>
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {trip.availableSeats} seats available
                  </span>
                </div>
              </div>

              <div className="text-right ml-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ${trip.price.toFixed(2)}
                </div>
                <button
                  onClick={() => onSelectTrip(trip)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

