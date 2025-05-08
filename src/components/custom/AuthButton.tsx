
"use client";

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react'; // Added Loader2 for loading state

export function AuthButton() {
  const { currentUser, login, logout, authLoading } = useAuth();

  if (authLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
      </Button>
    );
  }

  if (currentUser) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm hidden sm:inline">Welcome, {currentUser.name}!</span>
        <Button variant="outline" onClick={logout} size="sm">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" onClick={login} size="sm">
      <LogIn className="mr-2 h-4 w-4" /> Login with Google
    </Button>
  );
}
