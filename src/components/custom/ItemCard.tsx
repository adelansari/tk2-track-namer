"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import type { Track, BattleArena } from '@/lib/types';
import { fetchSuggestionsForItem } from '@/lib/data';

interface ItemCardProps {
  item: Track | BattleArena;
  itemType: 'track' | 'battle-arena';
}

export function ItemCard({ item, itemType }: ItemCardProps) {
  const [suggestionCount, setSuggestionCount] = useState<number>(item.suggestions?.length || 0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch suggestions directly in the component to ensure we have the latest count
  useEffect(() => {
    const getSuggestions = async () => {
      try {
        setIsLoading(true);
        const suggestions = await fetchSuggestionsForItem(item.id, itemType);
        setSuggestionCount(suggestions.length);
      } catch (error) {
        console.error(`Error fetching suggestions for ${item.id}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    getSuggestions();
  }, [item.id, itemType]);

  const link = `/${itemType === 'track' ? 'tracks' : 'battle-arenas'}/${item.id}`;
  const title = item.name || `${itemType === 'track' ? 'Track' : 'Arena'} ${String(item.numericId).padStart(2, '0')}`;
  
  // Check if the item name is a default Arena name (e.g. "Arena 01") which isn't a real official name
  const isDefaultArenaName = itemType === 'battle-arena' && item.name?.startsWith('Arena ');
  
  // Only consider it officially named if it has a name and it's not a default arena name
  const hasOfficialName = item.name && !isDefaultArenaName;
  
  return (
    <Card className="overflow-hidden shadow-md transition-all hover:shadow-lg hover:scale-[1.02] duration-300 ease-in-out">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={item.imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={item.imageHint}
            className="transition-transform duration-300 group-hover:scale-105 object-cover"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl mb-1 truncate">{title}</CardTitle>
        {hasOfficialName && (
           <CardDescription className="flex items-center text-sm text-green-600">
             <CheckCircle2 className="h-4 w-4 mr-1" /> Official Name
           </CardDescription>
        )}
        {!hasOfficialName && (
            <CardDescription className="text-sm">Suggest a name for this {itemType === 'track' ? 'track' : 'arena'}.</CardDescription>
        )}
        
        {suggestionCount > 0 ? (
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <MessageSquare className="h-3 w-3 mr-1" />
            {suggestionCount} suggestion{suggestionCount !== 1 ? 's' : ''}
          </p>
        ) : (
          !hasOfficialName && <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? 'Loading...' : 'No suggestions yet'}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant="outline">
          <Link href={link}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
