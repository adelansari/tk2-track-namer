"use client";

import { useState, useEffect } from 'react';
import { ItemCard } from './ItemCard';
import { fetchSuggestionsForItem } from '@/lib/data';
import type { Track, BattleArena, ItemType } from '@/lib/types';

// Keep track of the last fetch time globally to stagger requests
let lastFetchTime = 0;
const STAGGER_DELAY = 700; // 700ms delay between requests

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
        // Calculate how long to wait before making the request
        const now = Date.now();
        const timeToWait = Math.max(0, lastFetchTime + STAGGER_DELAY - now);
        
        // Wait for the calculated time before fetching
        if (timeToWait > 0) {
          await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
        
        // Update the last fetch time
        lastFetchTime = Date.now();
        
        // Now fetch the suggestions
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