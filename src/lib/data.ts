import type { Track, BattleArena, Suggestion, User, ItemType } from './types';

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

// --- Suggestion Functions ---
// Fetch suggestion counts for multiple items
export const fetchSuggestionCountsBatch = async (itemIds: string[], itemType: ItemType): Promise<Map<string, number>> => {
  try {
    const apiType = itemType === 'track' ? 'track' : 'arena';
    const isBuildTime = typeof process !== 'undefined' &&
                        process.env.NODE_ENV === 'production' &&
                        typeof window === 'undefined' &&
                        process.env.NEXT_PHASE === 'phase-production-build';

    if (isBuildTime) {
      console.log(`[Build] Skipping API fetch for suggestion counts for ${apiType}s`);
      const counts = new Map<string, number>();
      itemIds.forEach(id => counts.set(id, 0));
      return counts;
    }

    let baseUrl = '';
    if (typeof window !== 'undefined') {
      baseUrl = '';
    } else {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod') {
        baseUrl = process.env.NEXT_PUBLIC_PROD_URL || 'https://tk2-track-namer.vercel.app';
      } else {
        baseUrl = 'http://localhost:3000';
      }
    }

    // Construct the query parameters for multiple item IDs
    const itemIdParams = itemIds.map(id => `itemIds=${encodeURIComponent(id)}`).join('&');
    const response = await fetch(`${baseUrl}/api/suggestions?type=${apiType}&countsOnly=true&${itemIdParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch suggestion counts: ${response.status}`);
    }

    const data = await response.json(); // Expects { counts: { [itemId: string]: number } }
    
    const countsMap = new Map<string, number>();
    if (data.counts && typeof data.counts === 'object') {
      for (const [id, count] of Object.entries(data.counts)) {
        countsMap.set(id, count as number);
      }
    }
    return countsMap;
  } catch (error) {
    console.error('Error fetching suggestion counts batch:', error);
    // Return a map with 0 counts for all requested IDs in case of error
    const errorCounts = new Map<string, number>();
    itemIds.forEach(id => errorCounts.set(id, 0));
    return errorCounts;
  }
}

// Fetch suggestions from database
export const fetchSuggestionsForItem = async (itemId: string, itemType: ItemType): Promise<Suggestion[]> => {
  try {
    // Convert the itemType to API type format
    const apiType = itemType === 'track' ? 'track' : 'arena';
    
    // Only skip API calls during actual build phase, not during runtime in production
    const isBuildTime = typeof process !== 'undefined' && 
                        process.env.NODE_ENV === 'production' && 
                        typeof window === 'undefined' && 
                        process.env.NEXT_PHASE === 'phase-production-build';
    
    if (isBuildTime) {
      console.log(`[Build] Skipping API fetch for ${apiType} ${itemId}`);
      return [];
    }
    
    // Determine the base URL
    let baseUrl = '';
    
    // In browser environment, we can use relative URLs
    if (typeof window !== 'undefined') {
      // We're in the browser, use relative URL
      baseUrl = '';
    }
    // In server environment (but not during build)
    else {
      // For production SSR (not build)
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod') {
        baseUrl = process.env.NEXT_PUBLIC_PROD_URL || 'https://tk2-track-namer.vercel.app';
      } else {
        // For development SSR
        baseUrl = 'http://localhost:3000';
      }
    }
    
    const response = await fetch(`${baseUrl}/api/suggestions?type=${apiType}&itemId=${itemId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch suggestions: ${response.status}`);
    }

    const data = await response.json();
    
    return data.suggestions.map((suggestion: any) => ({
      id: suggestion.id.toString(),
      itemId: suggestion.item_id,
      userId: suggestion.user_id,
      userName: suggestion.user_display_name || 'Anonymous User',
      text: suggestion.name,
      votes: suggestion.votes || 0,
      createdAt: new Date(suggestion.created_at),
    }));
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

// Add suggestion
export const addSuggestion = async (itemId: string, itemType: ItemType, user: User, text: string): Promise<Suggestion | null> => {
  if (!user || !user.id || !user.name) {
    console.error("User details missing for adding suggestion.");
    return null;
  }

  try {
    // Convert the itemType to API type format
    const apiType = itemType === 'track' ? 'track' : 'arena';
    
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: apiType,
        item_id: itemId,
        name: text,
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error adding suggestion:', errorData);
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      return null;
    }

    // Map API response to our app's Suggestion type
    return {
      id: data.suggestion.id.toString(),
      itemId: data.suggestion.track_id || data.suggestion.arena_id,
      userId: data.suggestion.user_id,
      userName: user.name,
      text: data.suggestion.name,
      votes: data.suggestion.votes || 0,
      createdAt: new Date(data.suggestion.created_at),
    };
  } catch (error) {
    console.error('Error adding suggestion:', error);
    return null;
  }
};

// Update suggestion
export const updateSuggestion = async (suggestionId: string, newText: string, userId: string): Promise<Suggestion | null> => {
  try {
    const response = await fetch(`/api/suggestions/${suggestionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newText,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error updating suggestion:', errorData);
      return null;
    }

    const data = await response.json();
    if (!data.success) {
      return null;
    }

    // Map API response to our app's Suggestion type
    return {
      id: data.suggestion.id.toString(),
      itemId: data.suggestion.track_id || data.suggestion.arena_id,
      userId: data.suggestion.user_id,
      userName: '', // The API doesn't return the user's name, so we'll leave it blank
      text: data.suggestion.name,
      votes: data.suggestion.votes || 0,
      createdAt: new Date(data.suggestion.created_at),
    };
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return null;
  }
};

// Delete suggestion
export const deleteSuggestion = async (suggestionId: string, userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/suggestions/${suggestionId}?user_id=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error deleting suggestion:', errorData);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return false;
  }
};

// Vote on suggestion
export const voteSuggestion = async (suggestionId: string, action: 'upvote', userId: string): Promise<{ success: boolean, action?: 'added' | 'removed' }> => {
  try {
    const response = await fetch('/api/suggestions/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: suggestionId,
        action: 'upvote', // Only upvote is supported
        user_id: userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error voting on suggestion:', errorData);
      return { success: false };
    }

    const data = await response.json();
    return { 
      success: data.success === true,
      action: data.action as 'added' | 'removed'
    };
  } catch (error) {
    console.error('Error voting on suggestion:', error);
    return { success: false };
  }
};

// Get a user's vote on a specific suggestion
export const getUserVote = async (suggestionId: string, userId: string): Promise<'upvote' | null> => {
  try {
    const response = await fetch(`/api/suggestions/vote/status?suggestion_id=${suggestionId}&user_id=${userId}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data.success && data.vote) {
      return data.vote.vote_type === 1 ? 'upvote' : null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user vote status:', error);
    return null;
  }
};

// --- Track Functions ---
export const getTracks = async (): Promise<Track[]> => {
  // Fetch all tracks (assuming this part remains synchronous or is pre-loaded)
  const allTracks = tracks; // Using the in-memory tracks array

  // Get all track IDs
  const trackIds = allTracks.map(track => track.id);

  if (trackIds.length > 0) {
    // Fetch suggestion counts for all tracks in a single batch
    const suggestionCounts = await fetchSuggestionCountsBatch(trackIds, 'track');

    // Assign suggestion counts to each track
    // And initialize suggestions array if it's not already there
    return allTracks.map(track => ({
      ...track,
      suggestions: track.suggestions || [], // Ensure suggestions array exists
      suggestionCount: suggestionCounts.get(track.id) || 0,
    }));
  }
  // Return tracks with empty suggestions and 0 count if no IDs
  return allTracks.map(track => ({
    ...track,
    suggestions: track.suggestions || [],
    suggestionCount: 0,
  }));
};

export const getTrackById = (id: string): Track | undefined => tracks.find(t => t.id === id);

// --- Battle Arena Functions ---
export const getBattleArenas = async (): Promise<BattleArena[]> => {
  const allArenas = battleArenas; // Using the in-memory arenas array
  const arenaIds = allArenas.map(arena => arena.id);

  if (arenaIds.length > 0) {
    const suggestionCounts = await fetchSuggestionCountsBatch(arenaIds, 'battle-arena');
    return allArenas.map(arena => ({
      ...arena,
      suggestions: arena.suggestions || [],
      suggestionCount: suggestionCounts.get(arena.id) || 0,
    }));
  }
  return allArenas.map(arena => ({
    ...arena,
    suggestions: arena.suggestions || [],
    suggestionCount: 0,
  }));
};

export const getBattleArenaById = (id: string): BattleArena | undefined => battleArenas.find(a => a.id === id);

// --- User Profile Functions ---
export const updateUserProfile = async (userId: string, displayName: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ display_name: displayName }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

// The demo data population is kept for initial UI display
// These are for visual placeholder only.
const demoUser1: User = { id: 'demo-user-1', name: 'SpeedyRacerDemo' };
const demoUser2: User = { id: 'demo-user-2', name: 'ArenaChampDemo' };

if (tracks.length > 4) {
    // ...existing code...
}
if (battleArenas.length > 0) {
    // ...existing code...
}
