'use client';

import { useState } from 'react';

interface SearchFormProps {
  onSearch: (origin: string, destination: string, date: string) => void;
}

const cities = [
  'San Francisco',
  'Los Angeles',
  'Oakland',
  'Santa Barbara',
];

export function SearchForm({ onSearch }: SearchFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!origin || !destination || !date) {
      setError('Please fill in all fields');
      return;
    }

    if (origin === destination) {
      setError('Origin and destination must be different');
      return;
    }

    onSearch(origin, destination, date);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Book Your Trip
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">
          Origin
        </label>
        <select
          id="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select departure city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <select
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select arrival city</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Travel Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={today}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-[1.02]"
      >
        Search Trips
      </button>
    </form>
  );
}

