"use client";

import type { Suggestion, ItemType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { deleteSuggestion, voteSuggestion, fetchSuggestionsForItem } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, UserCircle, MessageSquareText, ThumbsUp, ThumbsDown } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SuggestionForm } from './SuggestionForm';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SuggestionListProps {
  itemId: string;
  itemType: ItemType;
  suggestions: Suggestion[];
}

export function SuggestionList({ itemId, itemType, suggestions: initialSuggestions }: SuggestionListProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Use state for suggestions to reflect client-side updates
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [voteInProgress, setVoteInProgress] = useState<string | null>(null);

  useEffect(() => {
    setSuggestions(initialSuggestions);
  }, [initialSuggestions]);

  // Refresh suggestions from the database
  const refreshSuggestions = async () => {
    setIsLoading(true);
    try {
      const freshSuggestions = await fetchSuggestionsForItem(itemId, itemType);
      setSuggestions(freshSuggestions);
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
  
  const openEditDialog = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setIsEditDialogOpen(true);
  };

  const handleSuggestionUpdated = async () => {
    closeEditDialog();
    await refreshSuggestions();
    router.refresh();
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingSuggestion(null);
  };
  
  const handleVote = async (suggestionId: string, action: 'upvote' | 'downvote') => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to vote on suggestions.", variant: "default" });
      return;
    }
    
    setVoteInProgress(suggestionId);
    try {
      const success = await voteSuggestion(suggestionId, action);
      
      if (success) {
        await refreshSuggestions();
        toast({ 
          title: action === 'upvote' ? "Upvoted!" : "Downvoted!", 
          description: `You ${action === 'upvote' ? 'upvoted' : 'downvoted'} this suggestion.` 
        });
      } else {
        toast({ title: "Error", description: "Failed to vote on suggestion.", variant: "destructive" });
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleVote(suggestion.id, 'upvote')}
                    disabled={voteInProgress === suggestion.id || !currentUser || isLoading}
                    className="h-8 w-8"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className="font-medium">{suggestion.votes || 0}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleVote(suggestion.id, 'downvote')}
                    disabled={voteInProgress === suggestion.id || !currentUser || isLoading}
                    className="h-8 w-8"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {currentUser && currentUser.id === suggestion.userId && (
                  <div className="flex justify-end gap-2">
                    <Dialog 
                      open={isEditDialogOpen && editingSuggestion?.id === suggestion.id} 
                      onOpenChange={(open) => { if(!open) closeEditDialog(); }}
                    >
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          disabled={isLoading} 
                          onClick={() => openEditDialog(suggestion)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Your Suggestion</DialogTitle>
                          <DialogDescription>
                            Modify your name suggestion for this item.
                          </DialogDescription>
                        </DialogHeader>
                        {editingSuggestion && (
                          <SuggestionForm
                            itemId={itemId}
                            itemType={itemType}
                            existingSuggestion={editingSuggestion}
                            onSuggestionSubmitted={handleSuggestionUpdated}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

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
