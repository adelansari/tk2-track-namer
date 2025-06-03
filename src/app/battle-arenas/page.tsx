import { getBattleArenas } from '@/lib/data';
import { ItemCard } from '@/components/custom/ItemCard';
import { Separator } from '@/components/ui/separator';
import { Swords } from 'lucide-react';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';

// Force dynamic rendering to prevent stale data caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BattleArenasPage() {
  const battleArenas = await getBattleArenas();

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ href: '/battle-arenas', label: 'Battle Arenas' }]} />
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Swords className="h-10 w-10 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Battle Arenas</h2>
        </div>
        <p className="text-muted-foreground text-center sm:text-right">
          Explore the battle arenas and help us find the perfect names.
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {battleArenas.map(arena => (
          <ItemCard key={arena.id} item={arena} itemType="battle-arena" />
        ))}
      </div>
    </div>
  );
}
