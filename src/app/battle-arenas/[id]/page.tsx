import { getBattleArenaById, getBattleArenas, fetchSuggestionsForItem } from '@/lib/data';
import Image from 'next/image';
import { SuggestionFormWrapper } from '@/components/custom/SuggestionFormWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';
import type { Suggestion } from '@/lib/types';

interface BattleArenaDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function BattleArenaDetailPage({ params }: BattleArenaDetailPageProps) {
  // Properly await the params in an async function
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const arena = getBattleArenaById(id);

  if (!arena) {
    notFound();
  }

  // Fetch actual suggestions for this arena
  let suggestions: Suggestion[] = [];
  try {
    suggestions = await fetchSuggestionsForItem(arena.id, 'battle-arena');
    arena.suggestions = suggestions;
  } catch (error) {
    console.error(`Error fetching suggestions for arena ${arena.id}:`, error);
    arena.suggestions = [];
  }

  const title = arena.name || `Arena ${String(arena.numericId).padStart(2, '0')}`;

  return (
    <div className="space-y-8">
      <Breadcrumbs
        segments={[
          { href: '/battle-arenas', label: 'Battle Arenas' },
          { href: '#', label: title }
        ]}
      />
      
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative h-64 md:h-96 w-full">
            <Image 
              src={arena.imageUrl} 
              alt={title} 
              fill
              sizes="100vw"
              priority
              data-ai-hint={arena.imageHint}
              className="object-cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardTitle className="text-3xl md:text-4xl font-bold mb-2">{title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mb-6">
            {/* Arena names are not pre-defined, so always show this message */}
            {`Help us find the perfect name for Arena ${String(arena.numericId).padStart(2, '0')}! Submit your creative ideas below.`}
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <SuggestionFormWrapper 
            itemId={arena.id} 
            itemType="battle-arena"
            initialSuggestions={suggestions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateStaticParams() {
  return getBattleArenas().map(arena => ({
    id: arena.id,
  }));
}
