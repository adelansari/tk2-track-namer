"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  displayName: z.string().min(2, {
    message: "Display name must be at least 2 characters.",
  }).max(50, {
    message: "Display name must be at most 50 characters.",
  }),
});

export function ProfileNameForm() {
  const { toast } = useToast();
  const { currentUser, updateDisplayName } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: currentUser?.name || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await updateDisplayName(values.displayName);
      
      if (success) {
        toast({ title: "Profile Updated", description: "Your display name has been updated successfully." });
      } else {
        toast({ title: "Update Failed", description: "There was a problem updating your display name. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return <p className="text-muted-foreground">Please log in to update your profile.</p>;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Update Profile</CardTitle>
        <CardDescription>Change how your name appears to others</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your display name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}