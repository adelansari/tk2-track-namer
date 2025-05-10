import { CategoryCard } from '@/components/custom/CategoryCard';
import { Route, Swords } from 'lucide-react';
import { getBattleArenas, getTracks } from '@/lib/data';

export default async function HomePage() {
  let tracks = [];
  let battleArenas = [];
  
  try {
    // Skip fetching suggestion counts since we don't need them on the home page
    tracks = await getTracks(true);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    // Continue with empty array
  }
  
  try {
    // Skip fetching suggestion counts since we don't need them on the home page
    battleArenas = await getBattleArenas(true);
  } catch (error) {
    console.error('Error fetching battle arenas:', error);
    // Continue with empty array
  }
  
  const tracksCount = tracks.length;
  const arenasCount = battleArenas.length;

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome to TrackNamer!</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Help us name the tracks and battle arenas for The Karters 2.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CategoryCard
          title="Racing Tracks"
          description={`Browse and suggest names for ${tracksCount} exciting racing tracks.`}
          link="/tracks"
          icon={<Route className="h-12 w-12 text-primary" />}
          itemCount={tracksCount}
          dataAiHint="track overview"
          imageUrl="/assets/Tracks/01.jpg" 
        />
        <CategoryCard
          title="Battle Arenas"
          description={`Explore and propose names for ${arenasCount} intense battle arenas.`}
          link="/battle-arenas"
          icon={<Swords className="h-12 w-12 text-primary" />}
          itemCount={arenasCount}
          dataAiHint="arena overview"
          imageUrl="/assets/BattleArena/01.jpg"
        />
      </section>
    </div>
  );
}
