"use client";

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AuthButton() {
  const { currentUser, login, logout, authLoading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    await login();
    if (!authLoading) {
      router.push('/profile');
    }
  };

  if (authLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
      </Button>
    );
  }

  if (currentUser) {
    return (
      <Button variant="outline" onClick={logout} size="sm">
        <LogOut className="mr-2 h-4 w-4" /> Logout
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleLogin} size="sm">
      <LogIn className="mr-2 h-4 w-4" /> Login with Google
    </Button>
  );
}
