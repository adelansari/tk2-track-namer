import { getTrackById, getTracks, fetchSuggestionsForItem } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { SuggestionFormWrapper } from '@/components/custom/SuggestionFormWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';
import { TrackScreenshotGallery } from '@/components/custom/TrackScreenshotGallery';
import { Track } from '@/lib/types';

interface TrackDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

// Function to get the base path for track screenshots
const getTrackScreenshotBasePath = (trackNumber: number): string | null => {
  try {
    // Only tracks 5-16 have screenshots
    if (trackNumber < 5 || trackNumber > 16) return null;
    
    // Format the track folder name
    const folderName = `track-${String(trackNumber).padStart(2, '0')}`;
    return `/assets/TrackScreenshots/${folderName}`;
  } catch (error) {
    console.error("Error getting track screenshot path:", error);
    return null;
  }
};

// Function to get screenshots for a track
const getTrackScreenshots = (trackNumber: number): string[] => {
  const basePath = getTrackScreenshotBasePath(trackNumber);
  if (!basePath) return [];
  
  // Return the base path for the gallery component to handle discovery
  // This is much more robust as the component will dynamically check which images exist
  return [`${basePath}/basepath`];
}

// Helper function to get next track ID
const getNextTrackId = (currentId: string): string | null => {
  const currentNumber = parseInt(currentId.split('-')[1]);
  const nextNumber = currentNumber + 1;
  return nextNumber <= 16 ? `track-${String(nextNumber).padStart(2, '0')}` : null;
};

// Helper function to get previous track ID
const getPrevTrackId = (currentId: string): string | null => {
  const currentNumber = parseInt(currentId.split('-')[1]);
  const prevNumber = currentNumber - 1;
  return prevNumber >= 1 ? `track-${String(prevNumber).padStart(2, '0')}` : null;
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
  try {
    const suggestions = await fetchSuggestionsForItem(track.id, 'track');
    track.suggestions = suggestions;
  } catch (error) {
    console.error(`Error fetching suggestions for track ${track.id}:`, error);
    track.suggestions = [];
  }
  
  const title = track.name || `Track ${String(track.numericId).padStart(2, '0')}`;
  const isPreNamedUneditable = !!track.name && track.numericId <= 4;
  
  // Get screenshots for this track
  const screenshots = getTrackScreenshots(track.numericId);

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
          <div className="flex items-center justify-between gap-4 mb-4">
            {getPrevTrackId(track.id) ? (
              <Link 
                href={`/tracks/${getPrevTrackId(track.id)}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev Track</span>
              </Link>
            ) : (
              <div className="w-[105px]" />
            )}

            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-center">{title}</CardTitle>
              {track.name && (
                <div className="flex items-center text-lg text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-md">
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Official Name
                </div>
              )}
            </div>

            {getNextTrackId(track.id) ? (
              <Link 
                href={`/tracks/${getNextTrackId(track.id)}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <span>Next Track</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="w-[105px]" />
            )}
          </div>
          <CardDescription className="text-lg text-muted-foreground mb-6">
            {isPreNamedUneditable 
              ? "This track has an official name. You cannot suggest a name."
              : `Help us find the perfect name for Track ${String(track.numericId).padStart(2, '0')}! Submit your creative ideas below.`
            }
          </CardDescription>
          
          {screenshots.length > 0 && (
            <TrackScreenshotGallery screenshots={screenshots} title={title} />
          )}
        </CardContent>
      </Card>      <Card>
        <CardContent className="p-6">
          <SuggestionFormWrapper 
            itemId={track.id} 
            itemType="track" 
            initialSuggestions={track.suggestions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateStaticParams() {
  const tracks = await getTracks();
  return tracks.map(track => ({
    id: track.id,
  }));
}
