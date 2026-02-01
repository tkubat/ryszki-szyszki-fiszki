import type { ReactNode } from "react";

import type { TabKey } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AppTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  generateContent: ReactNode;
  recipesContent: ReactNode;
}

const TAB_OPTIONS: TabKey[] = ["generate", "recipes"];

export default function AppTabs({ activeTab, onTabChange, generateContent, recipesContent }: AppTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        if (TAB_OPTIONS.includes(value as TabKey)) {
          onTabChange(value as TabKey);
        }
      }}
      className="w-full"
    >
      <TabsList className="w-full justify-start">
        <TabsTrigger value="generate">Generuj</TabsTrigger>
        <TabsTrigger value="recipes">Moje przepisy</TabsTrigger>
      </TabsList>
      <TabsContent value="generate">{generateContent}</TabsContent>
      <TabsContent value="recipes">{recipesContent}</TabsContent>
    </Tabs>
  );
}
