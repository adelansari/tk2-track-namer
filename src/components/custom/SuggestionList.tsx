
"use client";

import type { Suggestion, ItemType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { deleteSuggestion } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, UserCircle, MessageSquareText } from 'lucide-react';
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
  
  // Use state for suggestions to reflect client-side updates from router.refresh() more reliably
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    setSuggestions(initialSuggestions);
  }, [initialSuggestions]);


  const handleDelete = (suggestionId: string) => {
    if (!currentUser) return;
    const success = deleteSuggestion(suggestionId, currentUser.id);
    if (success) {
      toast({ title: "Deleted!", description: "Your suggestion has been removed." });
      router.refresh(); // This will cause initialSuggestions to update, and useEffect will update local state
    } else {
      toast({ title: "Error", description: "Failed to delete suggestion or not authorized.", variant: "destructive" });
    }
  };
  
  const openEditDialog = (suggestion: Suggestion) => {
    setEditingSuggestion(suggestion);
    setIsEditDialogOpen(true);
  };

  const handleSuggestionUpdated = () => {
    closeEditDialog();
    router.refresh(); // This will cause initialSuggestions to update, and useEffect will update local state
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingSuggestion(null);
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
      {suggestions.map(suggestion => (
        <div key={suggestion.id} className="rounded-lg border bg-card text-card-foreground p-4 shadow-sm flex justify-between items-start">
          <div>
            <p className="font-semibold text-primary">{suggestion.text}</p>
            <p className="text-sm text-muted-foreground flex items-center">
              <UserCircle className="h-4 w-4 mr-1.5" />
              By {suggestion.userName} - {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
            </p>
          </div>
          {currentUser && currentUser.id === suggestion.userId && (
            <div className="flex gap-2">
              <Dialog open={isEditDialogOpen && editingSuggestion?.id === suggestion.id} onOpenChange={(open) => { if(!open) closeEditDialog(); /* else openEditDialog is called by button */}}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(suggestion)}>
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
                  {editingSuggestion && ( // Ensure editingSuggestion is not null
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
                  <Button variant="destructive" size="icon">
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
        </div>
      ))}
    </div>
  );
}
