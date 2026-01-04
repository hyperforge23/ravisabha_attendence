import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTo12Hour(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format number in Indian style (1,000 and 1,00,000)
 * @param value - Number or string to format
 * @returns Formatted string with Indian-style commas
 */
export function formatIndianCurrency(value: number | string): string {
  if (!value && value !== 0) return '';
  
  // Convert to string and remove any existing commas
  const numStr = value.toString().replace(/,/g, '');
  
  // Handle decimal numbers
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part with Indian style commas
  // First 3 digits from right, then groups of 2
  let formatted = '';
  const reversed = integerPart.split('').reverse();
  
  for (let i = 0; i < reversed.length; i++) {
    if (i === 3) {
      formatted = ',' + formatted;
    } else if (i > 3 && (i - 3) % 2 === 0) {
      formatted = ',' + formatted;
    }
    formatted = reversed[i] + formatted;
  }
  
  // Add decimal part if exists
  return decimalPart ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * Parse Indian formatted currency string back to number
 * @param value - Formatted string with commas
 * @returns Number value
 */
export function parseIndianCurrency(value: string): string {
  // Remove all commas and return
  return value.replace(/,/g, '');
}

/**
 * Validate if a string is a valid MongoDB ObjectId
 * MongoDB ObjectId is a 24-character hexadecimal string
 * @param id - String to validate
 * @returns true if valid ObjectId format, false otherwise
 */
export function isValidObjectId(id: string | null | undefined): boolean {
  if (!id) return false;
  // MongoDB ObjectId must be exactly 24 hexadecimal characters
  return /^[0-9a-fA-F]{24}$/.test(id);
}