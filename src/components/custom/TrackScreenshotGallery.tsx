'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Dialog, 
  DialogContent,
  DialogClose
} from '@/components/ui/dialog';
import { CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';

interface TrackScreenshotGalleryProps {
  screenshots: string[];
  title: string;
}

export function TrackScreenshotGallery({ screenshots, title }: TrackScreenshotGalleryProps) {
  const [discoveredImages, setDiscoveredImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  
  useEffect(() => {
    // Only run if we're given a base path to work with
    if (screenshots.length === 0 || !screenshots[0].includes('/basepath')) {
      setDiscoveredImages(screenshots);
      setIsLoading(false);
      return;
    }

    const discoverScreenshots = async () => {
      setIsLoading(true);
      
      // Extract the base directory path from the special basepath marker
      const baseDirPath = screenshots[0].replace('/basepath', '');
      
      // Try potential screenshots with sequential numbering (01.jpeg, 02.jpeg, etc.)
      const potentialScreenshots: string[] = [];
      const maxImagesToCheck = 15; // Reasonable upper limit to avoid too many 404s
      
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      
      for (let i = 1; i <= maxImagesToCheck; i++) {
        potentialScreenshots.push(`${baseDirPath}/${String(i).padStart(2, '0')}.jpeg?t=${timestamp}`);
      }
      
      // Check which images actually exist
      const results = await Promise.all(
        potentialScreenshots.map(src => {
          return new Promise<string | null>((resolve) => {
            const img = new window.Image(); // Use window.Image instead of Image to avoid conflict
            img.onload = () => resolve(src);
            img.onerror = () => resolve(null);
            // Strip timestamp for error checking but keep it for successful loads
            img.src = src;
          });
        })
      );
      
      // Filter out the nulls (failed loads)
      const validScreenshots = results.filter(Boolean) as string[];
      setDiscoveredImages(validScreenshots);
      setIsLoading(false);
    };
    
    discoverScreenshots();
  }, [screenshots]);
  
  // Don't render anything while loading or if no valid images
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <CardDescription>Discovering screenshots...</CardDescription>
        </div>
      </div>
    );
  }
  
  if (discoveredImages.length === 0) {
    return null;
  }
  
  const openModalForImage = (index: number) => {
    setSelectedImage(index);
  };
  
  const getNextValidIndex = (direction: 'next' | 'prev') => {
    if (selectedImage === null) return null;
    
    const totalImages = discoveredImages.length;
    if (totalImages === 0) return null;
    
    if (direction === 'next') {
      return (selectedImage + 1) % totalImages;
    } else {
      return (selectedImage - 1 + totalImages) % totalImages;
    }
  };
  
  return (
    <div className="space-y-4">
      <CardDescription className="text-lg font-semibold">Track Screenshots</CardDescription>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {discoveredImages.map((screenshot, index) => (
          <div 
            key={index} 
            onClick={() => openModalForImage(index)}
            className="aspect-video rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
          >
            <div className="relative w-full h-full">
              <Image
                src={screenshot}
                alt={`${title} screenshot ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                unoptimized={true}
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                <span className="opacity-0 hover:opacity-100 text-white font-medium">Click to enlarge</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-7xl p-0 w-11/12 bg-background/10 backdrop-blur-xl border-primary/20 overflow-hidden">
          <DialogClose className="absolute right-5 top-5 z-50 rounded-full bg-background/80 p-2 text-foreground hover:bg-background transition-all">
            <X className="h-5 w-5" />
          </DialogClose>
          
          {selectedImage !== null && (
            <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={discoveredImages[selectedImage]}
                  alt={`${title} screenshot ${selectedImage + 1}`}
                  fill
                  priority
                  sizes="100vw"
                  className="object-contain p-4"
                  unoptimized={true} // Disables Next.js image optimization cache
                />
              </div>
              
              {discoveredImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevIndex = getNextValidIndex('prev');
                      if (prevIndex !== null) setSelectedImage(prevIndex);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 p-3 text-foreground hover:bg-background/100 transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIndex = getNextValidIndex('next');
                      if (nextIndex !== null) setSelectedImage(nextIndex);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 p-3 text-foreground hover:bg-background/100 transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm">
                {selectedImage + 1} / {discoveredImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
