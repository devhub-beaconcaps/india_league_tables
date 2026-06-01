import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

/**
 * Format number as INR currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}
