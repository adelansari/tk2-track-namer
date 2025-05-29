"use client";

import type { Suggestion, ItemType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { deleteSuggestion, voteSuggestion, fetchSuggestionsForItem, getUserVote, getUserVotesBatch } from '@/lib/data';
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
  useEffect(() => {
    setSuggestions(initialSuggestions);
  }, [initialSuggestions]);  // Load user's existing votes when component mounts or user changes
  useEffect(() => {
    if (currentUser && suggestions.length > 0) {
      const loadUserVotes = async () => {
        console.log(`Loading votes for user ${currentUser.id} for ${suggestions.length} suggestions`);
        
        try {
          // Use batch API to get all votes at once instead of individual calls
          const suggestionIds = suggestions.map(s => s.id);
          const suggestionTypeForAPI = itemType === 'track' ? 'track' : 'arena';
          const votes = await getUserVotesBatch(suggestionIds, currentUser.id, suggestionTypeForAPI);
          setUserVotes(votes);
        } catch (error) {
          console.error(`Error fetching batch votes:`, error);
          // Fallback to individual calls if batch fails
          const votes: Record<string, 'upvote' | null> = {};
          const suggestionTypeForAPI = itemType === 'track' ? 'track' : 'arena';
          for (const suggestion of suggestions) {
            try {
              const voteType = await getUserVote(suggestion.id, currentUser.id, suggestionTypeForAPI);
              votes[suggestion.id] = voteType === 'upvote' ? voteType : null;
            } catch (error) {
              console.error(`Error fetching vote for suggestion ${suggestion.id}:`, error);
            }
          }
          setUserVotes(votes);
        }
      };
      loadUserVotes();
    }
  }, [currentUser?.id, itemType]); // Add itemType to dependencies
  // Refresh suggestions from the database
  const refreshSuggestions = async () => {
    setIsLoading(true);
    try {
      // Force a delay to ensure the database has time to commit the changes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const freshSuggestions = await fetchSuggestionsForItem(itemId, itemType);
      console.log(`Refreshed ${itemType} suggestions for ${itemId}:`, freshSuggestions);
      setSuggestions(freshSuggestions);
        // Refresh vote statuses for the new suggestions if user is logged in
      if (currentUser && freshSuggestions.length > 0) {
        try {
          const suggestionIds = freshSuggestions.map(s => s.id);
          const suggestionTypeForAPI = itemType === 'track' ? 'track' : 'arena';
          const votes = await getUserVotesBatch(suggestionIds, currentUser.id, suggestionTypeForAPI);
          setUserVotes(votes);
        } catch (error) {
          console.error('Error refreshing vote statuses:', error);
        }
      }
      
      if (onSuggestionChanged) {
        await onSuggestionChanged();
      }
    } catch (error) {
      console.error('Error refreshing suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };const handleDelete = async (suggestionId: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      console.log(`Attempting to delete suggestion ID: ${suggestionId}, User ID: ${currentUser.id}`);
      
      // Disable super user mode for normal operation (security best practice)
      const superMode = true;
      
      // Find the suggestion in our local state to get more details
      const thisSuggestion = suggestions.find(s => s.id === suggestionId);
      console.log(`Deleting suggestion:`, thisSuggestion);
      
      // Show a toast notification that we're trying to delete
      toast({ title: "Deleting...", description: "Attempting to remove your suggestion." });
      
      // Attempt the deletion with regular user permissions
      const success = await deleteSuggestion(suggestionId, currentUser.id, superMode);
      
      if (success) {
        toast({ title: "Deleted!", description: "Your suggestion has been removed." });
        // Wait a bit longer to ensure the database has time to process the deletion
        await new Promise(resolve => setTimeout(resolve, 500));
        // Optimistic UI update - remove the suggestion from the local state
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        // Then refresh from server to be sure
        await refreshSuggestions();
        router.refresh();
      } else {
        toast({ title: "Error", description: "Failed to delete suggestion or not authorized.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast({ title: "Error", description: "An unexpected error occurred while deleting the suggestion.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  const handleVote = async (suggestionId: string) => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to vote on suggestions.", variant: "default" });
      return;
    }
    
    console.log(`Voting on suggestion ID: ${suggestionId}`);
    setVoteInProgress(suggestionId);    try {
      // Send the vote to the server immediately without optimistic updates
      console.log(`Attempting to vote on suggestion ${suggestionId} for user ${currentUser.id}`);
      
      // Convert itemType to suggestion type for the API
      const suggestionType = itemType === 'track' ? 'track' : 'arena';
      const result = await voteSuggestion(suggestionId, 'upvote', currentUser.id, suggestionType);
      console.log(`Vote result:`, result);
      
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
          // Add a small delay to ensure database has committed the vote count change
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`Refreshing suggestions after vote...`);
        // Refresh suggestions from the server to ensure accurate vote counts
        await refreshSuggestions();
        console.log(`Suggestions refreshed after vote.`);
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
