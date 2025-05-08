
export interface User {
  id: string; // Firebase UID
  name: string; // Firebase DisplayName
  email?: string | null; // Optional: Firebase email
  photoURL?: string | null; // Optional: Firebase photoURL
}

export interface Suggestion {
  id: string;
  itemId: string; // ID of Track or BattleArena
  userId: string; // Firebase UID of the user who made the suggestion
  userName: string; // Firebase DisplayName of the user
  text: string;
  createdAt: Date;
}

export interface Track {
  id: string;
  numericId: number;
  name?: string; // Pre-filled for tracks 01-04
  imageUrl: string;
  imageHint: string;
  suggestions: Suggestion[];
}

export interface BattleArena {
  id: string;
  numericId: number;
  name?: string;
  imageUrl: string;
  imageHint: string;
  suggestions: Suggestion[];
}

export type ItemType = 'track' | 'battle-arena';
