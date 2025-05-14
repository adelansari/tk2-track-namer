import { getBattleArenaById, getBattleArenas, fetchSuggestionsForItem } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { SuggestionFormWrapper } from '@/components/custom/SuggestionFormWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';

// Helper function to get next arena ID
const getNextArenaId = (currentId: string): string | null => {
  const currentNumber = parseInt(currentId.split('-')[1]);
  const nextNumber = currentNumber + 1;
  return nextNumber <= 9 ? `arena-${String(nextNumber).padStart(2, '0')}` : null;
};

// Helper function to get previous arena ID
const getPrevArenaId = (currentId: string): string | null => {
  const currentNumber = parseInt(currentId.split('-')[1]);
  const prevNumber = currentNumber - 1;
  return prevNumber >= 1 ? `arena-${String(prevNumber).padStart(2, '0')}` : null;
}

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
  try {
    const suggestions = await fetchSuggestionsForItem(arena.id, 'battle-arena');
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
        </CardHeader>        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            {getPrevArenaId(arena.id) ? (
              <Link 
                href={`/battle-arenas/${getPrevArenaId(arena.id)}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev Arena</span>
              </Link>
            ) : (
              <div className="w-[105px]" />
            )}

            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-center">{title}</CardTitle>
            </div>

            {getNextArenaId(arena.id) ? (
              <Link 
                href={`/battle-arenas/${getNextArenaId(arena.id)}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <span>Next Arena</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="w-[105px]" />
            )}
          </div>
          <CardDescription className="text-lg text-muted-foreground mb-6">
            {/* Arena names are not pre-defined, so always show this message */}
            {`Help us find the perfect name for Arena ${String(arena.numericId).padStart(2, '0')}! Submit your creative ideas below.`}
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <SuggestionFormWrapper itemId={arena.id} itemType="battle-arena" />
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateStaticParams() {
  const arenas = await getBattleArenas();
  return arenas.map(arena => ({
    id: arena.id,
  }));
}
