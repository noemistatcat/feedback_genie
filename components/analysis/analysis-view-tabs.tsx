"use client";

import React from 'react';
import { useAppContext } from '@/context/app-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThemeList } from './theme-list';
import CodeframeView from './codeframe/codeframe-view';
import { LayoutGrid, Table2 } from 'lucide-react';

export default function AnalysisViewTabs() {
  const { state, dispatch } = useAppContext();

  const handleViewChange = (view: string) => {
    dispatch({
      type: 'SET_ACTIVE_VIEW',
      payload: view as 'themes' | 'codeframe',
    });
  };

  return (
    <Tabs value={state.activeView} onValueChange={handleViewChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="themes">
          <LayoutGrid className="w-4 h-4 mr-2" />
          Theme Cards
        </TabsTrigger>
        <TabsTrigger value="codeframe">
          <Table2 className="w-4 h-4 mr-2" />
          Codeframe
        </TabsTrigger>
      </TabsList>

      <TabsContent value="themes">
        <ThemeList />
      </TabsContent>

      <TabsContent value="codeframe">
        <CodeframeView />
      </TabsContent>
    </Tabs>
  );
}
