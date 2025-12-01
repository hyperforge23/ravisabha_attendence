'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { User } from '@/lib/types';

interface SearchSectionProps {
  onSelectUser: (user: User) => void;
}

type SearchField = 'firstName' | 'lastName' | 'smkNo' | 'mobileNo';

export default function SearchSection({ onSelectUser }: SearchSectionProps) {
  const [searchField, setSearchField] = useState<SearchField>('firstName');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&field=${searchField}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.users);
        } else {
          console.error('Search failed');
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searchField]);

  const handleSelect = (user: User) => {
    onSelectUser(user);
    setQuery('');
    setResults([]);
    setIsFocused(false);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative w-full sm:w-48">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value as SearchField)}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="firstName">First Name</option>
          <option value="lastName">Last Name</option>
          <option value="smkNo">SMK No</option>
          <option value="mobileNo">Mobile No</option>
        </select>
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search by ${searchField}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        {isFocused && query && (
          <div className="absolute top-full mt-2 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg z-10">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
            ) : results.length > 0 ? (
              <ul className="max-h-60 overflow-y-auto py-2">
                {results.map((user) => (
                  <li
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center"
                  >
                    <span className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user.smkNo} • {user.mobileNo}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">No users found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
