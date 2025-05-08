import { getBattleArenaById, getBattleArenas } from '@/lib/data';
import Image from 'next/image';
import { SuggestionFormWrapper } from '@/components/custom/SuggestionFormWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';

interface BattleArenaDetailPageProps {
  params: { id: string };
}

export default function BattleArenaDetailPage({ params }: BattleArenaDetailPageProps) {
  // Use the id from params object
  const id = params.id;
  const arena = getBattleArenaById(id);

  if (!arena) {
    notFound();
  }

  const title = arena.name || `Arena ${String(arena.numericId).padStart(2, '0')}`;

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[
        { href: '/', label: 'Home' },
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
        <CardContent className="p-6">
          <SuggestionFormWrapper itemId={arena.id} itemType="battle-arena" />
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
