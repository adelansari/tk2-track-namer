"use client";

import type { Suggestion, ItemType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { deleteSuggestion, voteSuggestion, fetchSuggestionsForItem, getUserVote } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, UserCircle, MessageSquareText, ThumbsUp, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SuggestionListProps {
  itemId: string;
  itemType: ItemType;
  suggestions: Suggestion[];
  onEdit?: (suggestion: Suggestion) => void;
  onSuggestionChanged?: () => Promise<void>;
}

export function SuggestionList({ 
  itemId, 
  itemType, 
  suggestions: initialSuggestions,
  onEdit,
  onSuggestionChanged
}: SuggestionListProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Use state for suggestions to reflect client-side updates
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [isLoading, setIsLoading] = useState(false);
  const [voteInProgress, setVoteInProgress] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | null>>({});

  // Use effect to fetch suggestions if none are provided
  useEffect(() => {
    // If we have suggestions in props, use them
    if (initialSuggestions && initialSuggestions.length > 0) {
      setSuggestions(initialSuggestions);
      return;
    }

    // If no initial suggestions, fetch them
    if (initialSuggestions.length === 0) {
      refreshSuggestions();
    }
  }, [itemId, itemType]);  // Only run on mount and when item changes

  useEffect(() => {
    setSuggestions(initialSuggestions);
  }, [initialSuggestions]);

  // Use effect specifically to check if we need to force a refresh when suggestions appear empty but shouldn't be
  useEffect(() => {
    // If we're not loading, have no suggestions in state, but DO have initialSuggestions, sync them
    if (!isLoading && suggestions.length === 0 && initialSuggestions.length > 0) {
      setSuggestions(initialSuggestions);
    }
  }, [suggestions.length, initialSuggestions.length, isLoading]);

  // Load user's existing votes when component mounts
  useEffect(() => {
    if (currentUser && suggestions.length > 0) {
      const loadUserVotes = async () => {
        const votes: Record<string, 'upvote' | null> = {};
        
        for (const suggestion of suggestions) {
          try {
            const voteType = await getUserVote(suggestion.id, currentUser.id);
            // Only consider upvotes, ignore downvotes
            votes[suggestion.id] = voteType === 'upvote' ? voteType : null;
          } catch (error) {
            console.error(`Error fetching vote for suggestion ${suggestion.id}:`, error);
          }
        }
        
        setUserVotes(votes);
      };
      
      loadUserVotes();
    }
  }, [currentUser, suggestions]);

  // Refresh suggestions from the database
  const refreshSuggestions = async () => {
    setIsLoading(true);
    try {
      const freshSuggestions = await fetchSuggestionsForItem(itemId, itemType);
      setSuggestions(freshSuggestions);
      if (onSuggestionChanged) {
        await onSuggestionChanged();
      }
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (suggestionId: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const success = await deleteSuggestion(suggestionId, currentUser.id);
      
      if (success) {
        toast({ title: "Deleted!", description: "Your suggestion has been removed." });
        await refreshSuggestions();
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to delete suggestion or not authorized.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVote = async (suggestionId: string) => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to vote on suggestions.", variant: "default" });
      return;
    }
    
    setVoteInProgress(suggestionId);
    try {
      const result = await voteSuggestion(suggestionId, 'upvote', currentUser.id);
      
      if (result.success) {
        // Update the local userVotes state based on the action returned from the API
        if (result.action === 'added') {
          // Vote was added
          setUserVotes(prev => ({
            ...prev,
            [suggestionId]: 'upvote'
          }));
          
          toast({ 
            title: "Upvoted!", 
            description: "You upvoted this suggestion." 
          });
        } else if (result.action === 'removed') {
          // Vote was removed
          setUserVotes(prev => ({
            ...prev,
            [suggestionId]: null
          }));
          
          toast({ 
            title: "Vote Removed", 
            description: "Your vote has been removed." 
          });
        }
        
        // Refresh suggestions to update the vote count
        await refreshSuggestions();
      } else {
        toast({ title: "Error", description: "Failed to process your vote.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error voting on suggestion:', error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setVoteInProgress(null);
    }
  };

  // Simple empty state check - no automatic refreshing in the render method
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquareText className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">No suggestions yet. Be the first to add one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Community Suggestions</h3>
      <p className="text-muted-foreground mb-4">See what names others have suggested. Log in to manage your own.</p>
      
      <Table>
        <TableCaption>{isLoading ? "Loading suggestions..." : `${suggestions.length} name suggestion(s) found`}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Suggestion</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Votes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suggestions.map(suggestion => (
            <TableRow key={suggestion.id}>
              <TableCell className="font-medium">{suggestion.text}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <UserCircle className="h-4 w-4" />
                  <span>{suggestion.userName || 'Anonymous User'}</span>
                </div>
              </TableCell>
              <TableCell>{formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={userVotes[suggestion.id] === 'upvote' ? "default" : "ghost"}
                          size="icon" 
                          onClick={() => handleVote(suggestion.id)}
                          disabled={voteInProgress === suggestion.id || !currentUser || isLoading}
                          className={`h-8 w-8 ${userVotes[suggestion.id] === 'upvote' ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upvote this suggestion</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <div className="flex flex-col items-center min-w-[40px]">
                    <span className="font-medium">{suggestion.votes || 0}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {currentUser && currentUser.id === suggestion.userId && (
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={isLoading} 
                      onClick={() => onEdit ? onEdit(suggestion) : null}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your suggestion.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(suggestion.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
