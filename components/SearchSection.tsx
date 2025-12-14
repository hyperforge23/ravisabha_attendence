'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { User } from '@/lib/types';
import axios from 'axios';

interface SearchSectionProps {
  onSelectUser: (user: User) => void;
}

export default function SearchSection({ onSelectUser }: SearchSectionProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await axios.get('/api/search', {
          params: {
            query,
          },
        });
        setResults(data.users);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const handleSelect = (user: User) => {
    onSelectUser(user);
    setQuery('');
    setResults([]);
    setIsFocused(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        handleSelect(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, SMK no, or mobile no..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsFocused(true);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {isFocused && query && (
        <div className="absolute top-full mt-2 w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg z-10">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto py-2">
              {results.map((user, index) => (
                <li
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`cursor-pointer px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm transition-colors ${
                    index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </span>
                  
                  <div className="flex items-center gap-2 sm:contents">
                    <span className="text-gray-300 hidden sm:block">|</span>
                    <span className="whitespace-nowrap text-gray-500">
                      {user.smkNo}
                    </span>
                    <span className="text-gray-300 hidden sm:block">|</span>
                    <span className="whitespace-nowrap text-gray-500">
                      {user.mobileNo}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
