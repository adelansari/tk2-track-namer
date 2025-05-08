"use client";

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { ReactNode } from 'react';

interface BreadcrumbItem {
  href: string;
  label: string | ReactNode;
}

interface BreadcrumbsProps {
  segments?: BreadcrumbItem[];
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ segments, items }: BreadcrumbsProps) {
  // Use items if provided, otherwise use segments, or default to empty array for safety
  const breadcrumbItems = items || segments || [];
  
  const allItems = [
    { href: '/', label: <Home className="h-4 w-4" /> },
    ...breadcrumbItems,
  ];

  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-1.5 text-sm text-muted-foreground">
        {allItems.map((item, index) => (
          <li key={item.href + String(index)} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1.5 flex-shrink-0" />}
            {index === allItems.length - 1 ? (
              <span className="font-medium text-foreground truncate" title={typeof item.label === 'string' ? item.label : undefined}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-primary transition-colors truncate" title={typeof item.label === 'string' ? item.label : undefined}>
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
