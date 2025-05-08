import { getTracks, fetchSuggestionsForItem } from '@/lib/data';
import { ItemCard } from '@/components/custom/ItemCard';
import { Separator } from '@/components/ui/separator';
import { Route } from 'lucide-react';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';

export default async function TracksPage() {
  const tracks = getTracks();
  
  // Fetch suggestion counts for all tracks
  for (const track of tracks) {
    try {
      const suggestions = await fetchSuggestionsForItem(track.id, 'track');
      track.suggestions = suggestions;
    } catch (error) {
      console.error(`Error fetching suggestions for track ${track.id}:`, error);
      track.suggestions = [];
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={[{ href: '/tracks', label: 'Racing Tracks' }]} />
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Route className="h-10 w-10 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Racing Tracks</h2>
        </div>
        <p className="text-muted-foreground text-center sm:text-right">
          Browse all available racing tracks and suggest names.
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tracks.map(track => (
          <ItemCard key={track.id} item={track} itemType="track" />
        ))}
      </div>
    </div>
  );
}
