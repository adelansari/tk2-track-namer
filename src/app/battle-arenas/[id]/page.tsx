import { getBattleArenaById, getSuggestionsForItem, getBattleArenas } from '@/lib/data';
import Image from 'next/image';
import { SuggestionForm } from '@/components/custom/SuggestionForm';
import { SuggestionList } from '@/components/custom/SuggestionList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Users, Flag } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';

export default function BattleArenaDetailPage({ params }: { params: { id: string } }) {
  const arena = getBattleArenaById(params.id);

  if (!arena) {
    notFound();
  }

  const suggestions = getSuggestionsForItem(arena.id);
  const title = arena.name || `Arena ${String(arena.numericId).padStart(2, '0')}`;

  return (
    <div className="space-y-8">
      <Breadcrumbs segments={[
        { href: '/battle-arenas', label: 'Battle Arenas' },
        { href: `/battle-arenas/${arena.id}`, label: title }
      ]} />
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Flag className="h-6 w-6 text-primary" />
            Suggest a Name
          </CardTitle>
          <CardDescription>Logged-in users can submit one suggestion per arena.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Removed onSuggestionSubmitted prop */}
          <SuggestionForm itemId={arena.id} itemType="battle-arena" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-2xl">
             <Users className="h-6 w-6 text-primary" />
             Community Suggestions
           </CardTitle>
           <CardDescription>See what names others have suggested. Log in to manage your own.</CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestionList itemId={arena.id} itemType="battle-arena" suggestions={suggestions} />
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
