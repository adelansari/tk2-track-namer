'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestPage() {
  const [health, setHealth] = useState<any>(null);
  const [counts, setCounts] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});

  // Test health endpoint
  async function checkHealth() {
    setLoading(prev => ({ ...prev, health: true }));
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      setHealth({ error: String(error) });
    }
    setLoading(prev => ({ ...prev, health: false }));
  }

  // Test counts endpoint
  async function checkCounts() {
    setLoading(prev => ({ ...prev, counts: true }));
    try {
      // Test track counts
      const trackIds = ['track-01', 'track-02', 'track-03'];
      const idParams = trackIds.map(id => `itemIds=${id}`).join('&');
      const response = await fetch(`/api/suggestions?type=track&countsOnly=true&${idParams}`);
      const data = await response.json();
      setCounts(data);
    } catch (error) {
      setCounts({ error: String(error) });
    }
    setLoading(prev => ({ ...prev, counts: false }));
  }

  // Test suggestions endpoint
  async function checkSuggestions() {
    setLoading(prev => ({ ...prev, suggestions: true }));
    try {
      const response = await fetch('/api/suggestions?type=track&itemId=track-01');
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      setSuggestions({ error: String(error) });
    }
    setLoading(prev => ({ ...prev, suggestions: false }));
  }

  // Add seed data
  async function seedData() {
    setLoading(prev => ({ ...prev, seed: true }));
    try {
      const response = await fetch('/api/seed-data');
      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      alert('Error: ' + String(error));
    }
    setLoading(prev => ({ ...prev, seed: false }));
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API Diagnostic Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>API Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkHealth} 
              disabled={loading.health} 
              className="mr-2"
            >
              {loading.health ? 'Testing...' : 'Test Health API'}
            </Button>
            
            <Button 
              onClick={checkCounts} 
              disabled={loading.counts} 
              className="mr-2"
            >
              {loading.counts ? 'Testing...' : 'Test Counts API'}
            </Button>
            
            <Button 
              onClick={checkSuggestions} 
              disabled={loading.suggestions} 
              className="mr-2"
            >
              {loading.suggestions ? 'Testing...' : 'Test Suggestions API'}
            </Button>
            
            <Button 
              onClick={seedData} 
              disabled={loading.seed} 
              variant="outline"
            >
              {loading.seed ? 'Adding...' : 'Add Test Data'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="health">
        <TabsList>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="counts">Counts</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Health API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
                {health ? JSON.stringify(health, null, 2) : 'No data yet'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="counts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Counts API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
                {counts ? JSON.stringify(counts, null, 2) : 'No data yet'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suggestions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Suggestions API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded overflow-auto max-h-96">
                {suggestions ? JSON.stringify(suggestions, null, 2) : 'No data yet'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
