import type { Track, BattleArena, Suggestion, User } from './types';

// Initial data for tracks
let tracks: Track[] = Array.from({ length: 16 }, (_, i) => {
  let name: string | undefined = undefined;
  const numericId = i + 1;
  let imageHint = "track race";

  if (numericId === 1) { name = "Woodsy Lane"; imageHint = "forest path"; }
  else if (numericId === 2) { name = "Shiny Shroom"; imageHint = "shiny mushroom"; }
  else if (numericId === 3) { name = "Molten Mile"; imageHint = "lava cave"; }
  else if (numericId === 4) { name = "Mythic Moonlight"; imageHint = "moonlit ruins"; }
  else if (numericId === 5) { imageHint = "desert race"; }
  else if (numericId === 6) { imageHint = "icy speedway"; }
  else if (numericId === 7) { imageHint = "sky circuit"; }
  else if (numericId === 8) { imageHint = "urban chase"; }
  else if (numericId === 9) { imageHint = "jungle rally"; }
  else if (numericId === 10) { imageHint = "canyon dash"; }
  else if (numericId === 11) { imageHint = "beach sprint"; }
  else if (numericId === 12) { imageHint = "haunted drive"; }
  else if (numericId === 13) { imageHint = "crystal cavern"; }
  else if (numericId === 14) { imageHint = "retro highway"; }
  else if (numericId === 15) { imageHint = "tech parkway"; }
  else if (numericId === 16) { imageHint = "water rush"; }
  
  return {
    id: `track-${String(numericId).padStart(2, '0')}`,
    numericId: numericId,
    name: name,
    imageUrl: `/assets/Tracks/${String(numericId).padStart(2, '0')}.jpg`,
    imageHint: imageHint,
    suggestions: [],
  };
});

// Initial data for battle arenas
let battleArenas: BattleArena[] = Array.from({ length: 8 }, (_, i) => {
  const numericId = i + 1;
  let imageHint = "battle arena";

  if (numericId === 1) { imageHint = "volcano pit"; }
  else if (numericId === 2) { imageHint = "ice dome"; }
  else if (numericId === 3) { imageHint = "sand coliseum"; }
  else if (numericId === 4) { imageHint = "toxic factory"; }
  else if (numericId === 5) { imageHint = "sky platform"; }
  else if (numericId === 6) { imageHint = "castle courtyard"; }
  else if (numericId === 7) { imageHint = "shipwreck cove"; }
  else if (numericId === 8) { imageHint = "cyber grid"; }

  return {
    id: `arena-${String(numericId).padStart(2, '0')}`,
    numericId: numericId,
    name: `Arena ${String(numericId).padStart(2, '0')}`, // Default name
    imageUrl: `/assets/BattleArena/${String(numericId).padStart(2, '0')}.jpg`,
    imageHint: imageHint,
    suggestions: [],
  };
});

// --- Track Functions ---
export const getTracks = (): Track[] => tracks;
export const getTrackById = (id: string): Track | undefined => tracks.find(t => t.id === id);

// --- Battle Arena Functions ---
export const getBattleArenas = (): BattleArena[] => battleArenas;
export const getBattleArenaById = (id: string): BattleArena | undefined => battleArenas.find(a => a.id === id);

// --- Suggestion Functions ---
export const getSuggestionsForItem = (itemId: string): Suggestion[] => {
  const track = getTrackById(itemId);
  if (track) return [...track.suggestions].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); // Return sorted copy
  const arena = getBattleArenaById(itemId);
  if (arena) return [...arena.suggestions].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()); // Return sorted copy
  return [];
};

// addSuggestion now takes user object directly for Firebase details
export const addSuggestion = (itemId: string, itemType: 'track' | 'battle-arena', user: User, text: string): Suggestion | null => {
  if (!user || !user.id || !user.name) {
    console.error("User details missing for adding suggestion.");
    return null;
  }

  const item = itemType === 'track' ? getTrackById(itemId) : getBattleArenaById(itemId);
  if (!item) return null;

  if (item.suggestions.some(s => s.userId === user.id)) {
    console.warn("User already submitted a suggestion for this item.");
    return null; 
  }

  const newSuggestion: Suggestion = {
    id: `sug-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    itemId,
    userId: user.id, // Firebase UID
    userName: user.name, // Firebase DisplayName
    text,
    createdAt: new Date(),
  };
  item.suggestions.push(newSuggestion);
  // Sorting is now handled in getSuggestionsForItem
  return newSuggestion;
};

// updateSuggestion now takes userId for authorization
export const updateSuggestion = (suggestionId: string, newText: string, userId: string): Suggestion | null => {
  const allItems: (Track | BattleArena)[] = [...tracks, ...battleArenas];
  for (const item of allItems) {
    const suggestionIndex = item.suggestions.findIndex(s => s.id === suggestionId && s.userId === userId);
    if (suggestionIndex !== -1) {
      item.suggestions[suggestionIndex].text = newText;
      item.suggestions[suggestionIndex].createdAt = new Date(); // Update timestamp on edit
      return item.suggestions[suggestionIndex];
    }
  }
  return null;
};

// deleteSuggestion now takes userId for authorization
export const deleteSuggestion = (suggestionId: string, userId: string): boolean => {
  const allItems: (Track | BattleArena)[] = [...tracks, ...battleArenas];
  for (const item of allItems) {
    const suggestionIndex = item.suggestions.findIndex(s => s.id === suggestionId && s.userId === userId);
    if (suggestionIndex !== -1) {
      item.suggestions.splice(suggestionIndex, 1);
      return true;
    }
  }
  return false;
};

// Populate some initial suggestions for demonstration (these won't have real Firebase user IDs)
// These are for visual placeholder only.
const demoUser1: User = { id: 'demo-user-1', name: 'SpeedyRacerDemo' };
const demoUser2: User = { id: 'demo-user-2', name: 'ArenaChampDemo' };

if (tracks.length > 4) {
    addSuggestion(tracks[4].id, 'track', demoUser1, 'Cosmic Canyon (Demo)');
    addSuggestion(tracks[4].id, 'track', demoUser2, 'Galaxy Gauntlet (Demo)');
}
if (battleArenas.length > 0) {
    addSuggestion(battleArenas[0].id, 'battle-arena', demoUser1, 'Thunderdome (Demo)');
}
