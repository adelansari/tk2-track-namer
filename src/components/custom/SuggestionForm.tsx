"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import type { Suggestion, ItemType } from "@/lib/types";
import { addSuggestion, updateSuggestion, getTrackById, getBattleArenaById } from "@/lib/data"; 
import { useRouter } from 'next/navigation'; 
import { useState } from 'react';

const formSchema = z.object({
  suggestionText: z.string().min(2, {
    message: "Suggestion must be at least 2 characters.",
  }).max(50, {
    message: "Suggestion must be at most 50 characters.",
  }),
});

interface SuggestionFormProps {
  itemId: string;
  itemType: ItemType;
  existingSuggestion?: Suggestion | null; 
  onSuggestionSubmitted?: () => void;
}

export function SuggestionForm({ itemId, itemType, existingSuggestion, onSuggestionSubmitted }: SuggestionFormProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suggestionText: existingSuggestion?.text || "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to suggest a name.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let result: Suggestion | null = null;
      
      if (existingSuggestion) {
        // Update existing suggestion
        result = await updateSuggestion(existingSuggestion.id, values.suggestionText, currentUser.id);
        
        if (result) {
          toast({ title: "Success!", description: "Your suggestion has been updated." });
        } else {
          toast({ title: "Error", description: "Failed to update suggestion or not authorized.", variant: "destructive" });
        }
      } else {
        // Add new suggestion
        result = await addSuggestion(itemId, itemType, currentUser, values.suggestionText);
        
        if (result) {
          toast({ title: "Success!", description: "Your suggestion has been submitted." });
        } else {
          toast({ 
            title: "Error", 
            description: "Failed to submit suggestion.", 
            variant: "destructive" 
          });
        }
      }
      
      if (result) {
        form.reset({ suggestionText: "" }); 
        onSuggestionSubmitted?.();
        router.refresh(); 
      }
    } catch (error) {
      console.error("Suggestion submission error:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return <p className="text-muted-foreground">Please log in to suggest a name.</p>;
  }

  const itemData = itemType === 'track' ? getTrackById(itemId) : getBattleArenaById(itemId);
  
  const isPreNamed = itemData?.name;
  const isUneditablePreNamedTrack = itemType === 'track' && isPreNamed && itemData && itemData.numericId <= 4;

  if (isUneditablePreNamedTrack && !existingSuggestion) { 
    return <p className="text-muted-foreground">This track has an official name and new suggestions cannot be submitted. You can still edit your existing suggestion if available.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="suggestionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{existingSuggestion ? "Edit Your Suggestion" : "Your Name Suggestion"}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Turbo Tundra, Pixel Plaza" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full sm:w-auto" 
          variant={existingSuggestion ? "secondary" : "default"}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (existingSuggestion ? "Updating..." : "Submitting...") 
            : (existingSuggestion ? "Update Suggestion" : "Submit Suggestion")
          }
        </Button>
      </form>
    </Form>
  );
}
