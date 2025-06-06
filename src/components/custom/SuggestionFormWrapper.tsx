"use client";

import { useState, useEffect } from 'react';
import { SuggestionForm } from './SuggestionForm';
import { SuggestionList } from './SuggestionList';
import { fetchSuggestionsForItem } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import type { ItemType, Suggestion } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

interface SuggestionFormWrapperProps {
  itemId: string;
  itemType: ItemType;
  initialSuggestions?: Suggestion[]; // Accept pre-fetched suggestions
}

export function SuggestionFormWrapper({ itemId, itemType, initialSuggestions = [] }: SuggestionFormWrapperProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [loading, setLoading] = useState(initialSuggestions.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isNewSuggestionDialogOpen, setIsNewSuggestionDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const { currentUser } = useAuth();

  // Fetch suggestions from the database only if no initial suggestions provided
  useEffect(() => {
    // Skip fetching if we already have initial suggestions
    if (initialSuggestions.length > 0) {
      return;
    }

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
  }, [itemId, itemType, initialSuggestions.length]);

  const refreshSuggestions = async () => {
    try {
      const data = await fetchSuggestionsForItem(itemId, itemType);
      setSuggestions(data);
    } catch (err) {
      console.error('Error refetching suggestions:', err);
    }
  };

  const handleSuggestionSubmitted = async () => {
    await refreshSuggestions();
    setIsNewSuggestionDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingSuggestion(null);
  };

  const openEditDialog = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 py-2">      <div className="bg-muted/50 rounded-lg p-4">
        <div className="mb-4">
          <h2 className="font-semibold text-xl">Suggest a Name</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <SuggestionForm 
            itemId={itemId} 
            itemType={itemType}
            onSuggestionSubmitted={handleSuggestionSubmitted}
          />
        )}
      </div>

      {/* New Suggestion Dialog */}
      <Dialog 
        open={isNewSuggestionDialogOpen} 
        onOpenChange={setIsNewSuggestionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Suggestion</DialogTitle>
            <DialogDescription>
              Submit another name suggestion for this item
            </DialogDescription>
          </DialogHeader>
          <SuggestionForm 
            itemId={itemId} 
            itemType={itemType} 
            onSuggestionSubmitted={handleSuggestionSubmitted}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Suggestion Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Your Suggestion</DialogTitle>
            <DialogDescription>
              Update your existing name suggestion
            </DialogDescription>
          </DialogHeader>
          {editingSuggestion && (
            <SuggestionForm 
              itemId={itemId} 
              itemType={itemType}
              existingSuggestion={editingSuggestion}
              onSuggestionSubmitted={handleSuggestionSubmitted}
            />
          )}
        </DialogContent>
      </Dialog>

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
            onEdit={openEditDialog}
            onSuggestionChanged={refreshSuggestions}
          />
        )}
      </div>
    </div>
  );
}