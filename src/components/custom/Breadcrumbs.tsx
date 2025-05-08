
"use client";

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { ReactNode } from 'react';

interface BreadcrumbSegment {
  href: string;
  label: string | ReactNode;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
}

export function Breadcrumbs({ segments }: BreadcrumbsProps) {
  const allSegments = [
    { href: '/', label: <Home className="h-4 w-4" /> },
    ...segments,
  ];

  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-1.5 text-sm text-muted-foreground">
        {allSegments.map((segment, index) => (
          <li key={segment.href + String(index)} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1.5 flex-shrink-0" />}
            {index === allSegments.length - 1 ? (
              <span className="font-medium text-foreground truncate" title={typeof segment.label === 'string' ? segment.label : undefined}>
                {segment.label}
              </span>
            ) : (
              <Link href={segment.href} className="hover:text-primary transition-colors truncate" title={typeof segment.label === 'string' ? segment.label : undefined}>
                {segment.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
