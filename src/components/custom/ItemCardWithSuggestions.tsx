"use client";

import { useState, useEffect } from 'react';
import { ItemCard } from './ItemCard';
import { fetchSuggestionsForItem } from '@/lib/data';
import type { Track, BattleArena, ItemType } from '@/lib/types';

interface ItemCardWithSuggestionsProps {
  item: Track | BattleArena;
  itemType: ItemType;
}

export function ItemCardWithSuggestions({ item, itemType }: ItemCardWithSuggestionsProps) {
  const [itemWithSuggestions, setItemWithSuggestions] = useState(item);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    async function getSuggestions() {
      setIsLoading(true);
      try {
        const suggestions = await fetchSuggestionsForItem(item.id, itemType);
        setItemWithSuggestions({
          ...item,
          suggestions
        });
      } catch (error) {
        console.error(`Error fetching suggestions for ${item.id}:`, error);
      } finally {
        setIsLoading(false);
      }
    }
    
    getSuggestions();
  }, [item, itemType]);
  
  return <ItemCard item={itemWithSuggestions} itemType={itemType} />;
}