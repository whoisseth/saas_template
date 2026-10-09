import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  input: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  let date = new Date(input);
  if (isNaN(date.getTime())) return "";

  // Guard against accidental milliseconds-in-seconds conversion (year > 3000)
  if (date.getFullYear() > 3000) {
    date = new Date(date.getTime() / 1000);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(date);
}

