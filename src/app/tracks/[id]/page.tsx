import { getTrackById, getSuggestionsForItem, getTracks } from '@/lib/data';
import Image from 'next/image';
import { SuggestionForm } from '@/components/custom/SuggestionForm';
import { SuggestionList } from '@/components/custom/SuggestionList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Flag, Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/custom/Breadcrumbs';

export default function TrackDetailPage({ params }: { params: { id: string } }) {
  const track = getTrackById(params.id);

  if (!track) {
    notFound();
  }
  
  const suggestions = getSuggestionsForItem(track.id);
  const title = track.name || `Track ${String(track.numericId).padStart(2, '0')}`;
  const isPreNamedUneditable = !!track.name && track.numericId <= 4;

  return (
    <div className="space-y-8">
      <Breadcrumbs segments={[
        { href: '/tracks', label: 'Racing Tracks' },
        { href: `/tracks/${track.id}`, label: title }
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
            {track.name && ( // Show "Official Name" if any name is present
              <div className="flex items-center text-lg text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1.5 rounded-md">
                <CheckCircle2 className="h-5 w-5 mr-2" /> Official Name
              </div>
            )}
          </div>
          <CardDescription className="text-lg text-muted-foreground mb-6">
            {isPreNamedUneditable 
              ? "This track has an official name. You can still view suggestions from others."
              : `Help us find the perfect name for Track ${String(track.numericId).padStart(2, '0')}! Submit your creative ideas below.`
            }
          </CardDescription>
        </CardContent>
      </Card>

      {!isPreNamedUneditable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Flag className="h-6 w-6 text-primary" />
              Suggest a Name
            </CardTitle>
            <CardDescription>Logged-in users can submit one suggestion per track.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Removed onSuggestionSubmitted prop */}
            <SuggestionForm itemId={track.id} itemType="track" />
          </CardContent>
        </Card>
      )}
      
      {isPreNamedUneditable && suggestions.length === 0 && (
         <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            This track has an official name, and no community suggestions have been made for it.
          </CardContent>
        </Card>
      )}

      {(suggestions.length > 0 || !isPreNamedUneditable) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-6 w-6 text-primary" />
              Community Suggestions
            </CardTitle>
            <CardDescription>See what names others have suggested. Log in to manage your own.</CardDescription>
          </CardHeader>
          <CardContent>
            <SuggestionList itemId={track.id} itemType="track" suggestions={suggestions} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  return getTracks().map(track => ({
    id: track.id,
  }));
}
