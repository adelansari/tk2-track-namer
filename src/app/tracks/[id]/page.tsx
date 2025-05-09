import { getTrackById, getTracks, fetchSuggestionsForItem } from '@/lib/data';
import Image from 'next/image';
import { SuggestionFormWrapper } from '@/components/custom/SuggestionFormWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';
import type { Suggestion } from '@/lib/types';

interface TrackDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function TrackDetailPage({ params }: TrackDetailPageProps) {
  // Properly await the params in an async function
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const track = getTrackById(id);

  if (!track) {
    notFound();
  }
  
  // Fetch actual suggestions for this track
  let suggestions: Suggestion[] = [];
  try {
    suggestions = await fetchSuggestionsForItem(track.id, 'track');
    track.suggestions = suggestions;
  } catch (error) {
    console.error(`Error fetching suggestions for track ${track.id}:`, error);
    track.suggestions = [];
  }
  
  const title = track.name || `Track ${String(track.numericId).padStart(2, '0')}`;
  const isPreNamedUneditable = !!track.name && track.numericId <= 4;

  return (
    <div className="space-y-8">
      <Breadcrumbs segments={[
        { href: '/tracks', label: 'Racing Tracks' },
        { href: '#', label: title }
      ]} />
      
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="relative h-64 md:h-96 w-full">
            <Image 
              src={track.imageUrl} 
              alt={title} 
              fill
              sizes="100vw"
              priority
              data-ai-hint={track.imageHint}
              className="object-cover"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <CardTitle className="text-3xl md:text-4xl font-bold">{title}</CardTitle>
            {track.name && (
              <div className="flex items-center text-lg text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1.5 rounded-md">
                <CheckCircle2 className="h-5 w-5 mr-2" /> Official Name
              </div>
            )}
          </div>
          <CardDescription className="text-lg text-muted-foreground mb-6">
            {isPreNamedUneditable 
              ? "This track has an official name. You cannot suggest a name."
              : `Help us find the perfect name for Track ${String(track.numericId).padStart(2, '0')}! Submit your creative ideas below.`
            }
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <SuggestionFormWrapper 
            itemId={track.id} 
            itemType="track"
            initialSuggestions={suggestions} 
          />
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateStaticParams() {
  return getTracks().map(track => ({
    id: track.id,
  }));
}
