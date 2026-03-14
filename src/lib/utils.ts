import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildGoogleMapsUrl(options: {
  lat?: number;
  lng?: number;
  label?: string;
}) {
  const { lat, lng, label } = options;

  if (typeof lat === "number" && typeof lng === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  if (label) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
  }

  return undefined;
}
