"use client";

import Link from 'next/link';
import { AuthButton } from './AuthButton';
import { Button } from '@/components/ui/button';
import { Gamepad2, Map, Swords, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { currentUser } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 md:px-6 lg:px-8 max-w-screen-xl mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-primary">TrackNamer</h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-5">
            <Link 
              href="/tracks" 
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
            >
              <Map className="h-4 w-4" />
              Tracks
            </Link>
            <Link 
              href="/battle-arenas" 
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
            >
              <Swords className="h-4 w-4" />
              Battle Arenas
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <span className="text-sm hidden sm:inline text-muted-foreground">Welcome, {currentUser.name}!</span>
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
            </>
          )}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
