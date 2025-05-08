import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Track, BattleArena } from '@/lib/types';

interface ItemCardProps {
  item: Track | BattleArena;
  itemType: 'track' | 'battle-arena';
}

export function ItemCard({ item, itemType }: ItemCardProps) {
  const link = `/${itemType === 'track' ? 'tracks' : 'battle-arenas'}/${item.id}`;
  const title = item.name || `${itemType === 'track' ? 'Track' : 'Arena'} ${String(item.numericId).padStart(2, '0')}`;
  
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
        {item.name && (
           <CardDescription className="flex items-center text-sm text-green-600">
             <CheckCircle2 className="h-4 w-4 mr-1" /> Official Name
           </CardDescription>
        )}
        {!item.name && (
            <CardDescription className="text-sm">Suggest a name for this {itemType}.</CardDescription>
        )}
         <p className="text-xs text-muted-foreground mt-1">{item.suggestions.length} suggestion(s)</p>
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
