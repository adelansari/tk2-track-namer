import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import type { ReactElement } from 'react';

interface CategoryCardProps {
  title: string;
  description: string;
  link: string;
  icon: ReactElement;
  itemCount: number;
  imageUrl: string; // Now points to images in /src/assets directory
  dataAiHint: string;
}

export function CategoryCard({ title, description, link, icon, itemCount, imageUrl, dataAiHint }: CategoryCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="flex-row items-start gap-4 space-y-0 bg-muted/30 p-4 sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {React.cloneElement(icon, { className: "h-6 w-6" })}
        </div>
        <div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{itemCount} items</CardDescription>
        </div>
      </CardHeader>
      <div className="relative h-48 w-full">
        <Image 
            src={imageUrl} 
            alt={title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={dataAiHint}
            className="object-cover" 
        />
      </div>
      <CardContent className="flex-grow p-4 sm:p-6">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="p-4 sm:p-6 pt-0">
        <Button asChild className="w-full" variant="default">
          <Link href={link}>
            Explore {title} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
