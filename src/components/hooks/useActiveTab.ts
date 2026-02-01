import { useCallback, useEffect, useState } from "react";

import type { TabKey } from "@/types";

const allowedTabs: TabKey[] = ["generate", "recipes"];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.location !== "undefined";
}

function getTabFromUrl(defaultTab: TabKey): TabKey {
  if (!isBrowser()) {
    return defaultTab;
  }

  const params = new URLSearchParams(window.location.search);
  const value = params.get("tab");

  if (value && allowedTabs.includes(value as TabKey)) {
    return value as TabKey;
  }

  return defaultTab;
}

export function useActiveTab(defaultTab: TabKey) {
  const [activeTab, setActiveTabState] = useState<TabKey>(() => getTabFromUrl(defaultTab));

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }

    const initialTab = getTabFromUrl(defaultTab);
    setActiveTabState(initialTab);

    const handlePopState = () => {
      setActiveTabState(getTabFromUrl(defaultTab));
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [defaultTab]);

  const setActiveTab = useCallback((nextTab: TabKey) => {
    setActiveTabState(nextTab);

    if (!isBrowser()) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    window.history.replaceState({}, "", url);
  }, []);

  return { activeTab, setActiveTab };
}
