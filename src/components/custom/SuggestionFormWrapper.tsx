"use client";

import { useState, useEffect } from 'react';
import { SuggestionForm } from './SuggestionForm';
import { SuggestionList } from './SuggestionList';
import { fetchSuggestionsForItem } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import type { ItemType, Suggestion } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface SuggestionFormWrapperProps {
  itemId: string;
  itemType: ItemType;
}

export function SuggestionFormWrapper({ itemId, itemType }: SuggestionFormWrapperProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Fetch suggestions from the database when component mounts or when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchSuggestionsForItem(itemId, itemType);
        setSuggestions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError('Failed to load suggestions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId, itemType]);

  // Check if the current user already has a suggestion for this item
  const userSuggestion = currentUser 
    ? suggestions.find(s => s.userId === currentUser.id) 
    : null;

  return (
    <div className="space-y-6 py-2">
      <div className="bg-muted/50 rounded-lg p-4">
        <h2 className="font-semibold text-xl mb-4">Suggest a Name</h2>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <SuggestionForm 
            itemId={itemId} 
            itemType={itemType}
            existingSuggestion={userSuggestion} 
            onSuggestionSubmitted={() => {
              // Refetch suggestions when a new one is submitted
              fetchSuggestionsForItem(itemId, itemType)
                .then(data => setSuggestions(data))
                .catch(err => console.error('Error refetching suggestions:', err));
            }}
          />
        )}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <SuggestionList 
            itemId={itemId} 
            itemType={itemType}
            suggestions={suggestions}
          />
        )}
      </div>
    </div>
  );
}