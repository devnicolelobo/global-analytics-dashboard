'use client';

/**
 * Client-only selection state for the dashboard shell.
 *
 * React Context keeps a single source of truth for global vs country view (REQ-F-22)
 * without prop drilling. This boundary is required because map/chart panels (DEV-92+)
 * are Client Components (Leaflet, dynamic chart libs); the root layout stays a Server
 * Component while only the dashboard subtree opts into client state.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  applyClearSelection,
  applySelectCountry,
  type DashboardSelectionContextValue,
  type SelectedCountry,
} from '@/lib/dashboard/selection';

const DashboardSelectionContext =
  createContext<DashboardSelectionContextValue | null>(null);

type DashboardSelectionProviderProps = {
  children: ReactNode;
};

export function DashboardSelectionProvider({
  children,
}: DashboardSelectionProviderProps) {
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry>(null);

  const selectCountry = useCallback((code: string) => {
    setSelectedCountry((current) => applySelectCountry(current, code));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCountry(applyClearSelection());
  }, []);

  const value = useMemo<DashboardSelectionContextValue>(
    () => ({
      selectedCountry,
      selectCountry,
      clearSelection,
    }),
    [selectedCountry, selectCountry, clearSelection],
  );

  return (
    <DashboardSelectionContext.Provider value={value}>
      {children}
    </DashboardSelectionContext.Provider>
  );
}

export function useDashboardSelection(): DashboardSelectionContextValue {
  const context = useContext(DashboardSelectionContext);
  if (context === null) {
    throw new Error(
      'useDashboardSelection must be used within DashboardSelectionProvider',
    );
  }
  return context;
}
