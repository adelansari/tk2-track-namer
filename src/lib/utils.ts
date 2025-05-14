import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to dynamically import track and arena images
export function getAssetImagePath(type: 'Tracks' | 'BattleArena', number: number): string {
  // Format the number with leading zero if needed
  const formattedNumber = String(number).padStart(2, '0');
  const basePath = type === 'Tracks' ? '/tracks' : '/battle-arenas';
  
  return `${basePath}/assets/${formattedNumber}`;
}
