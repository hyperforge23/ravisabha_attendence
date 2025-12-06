'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { User } from '@/lib/types';
import axios from 'axios';

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
            field: searchField,
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
  }, [query, searchField]);

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
                {results.map((user, index) => {
                  const isNameMatch = searchField === 'firstName' || searchField === 'lastName';
                  const isSmkMatch = searchField === 'smkNo';
                  const isMobileMatch = searchField === 'mobileNo';

                  return (
                    <li
                      key={user.id}
                      onClick={() => handleSelect(user)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`cursor-pointer px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm transition-colors ${
                        index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`${isNameMatch ? "font-bold text-gray-900" : "text-gray-500"}`}>
                        {user.firstName} {user.lastName}
                      </span>
                      
                      <div className="flex items-center gap-2 sm:contents">
                        <span className="text-gray-300 hidden sm:block">|</span>
                        <span className={`whitespace-nowrap ${isSmkMatch ? "font-bold text-gray-900" : "text-gray-500"}`}>
                          {user.smkNo}
                        </span>
                        <span className="text-gray-300 hidden sm:block">|</span>
                        <span className={`whitespace-nowrap ${isMobileMatch ? "font-bold text-gray-900" : "text-gray-500"}`}>
                          {user.mobileNo}
                        </span>
                      </div>
                    </li>
                  );
                })}
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
