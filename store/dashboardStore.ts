import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export type VisualType = 'progressRing' | 'counter' | 'segmentedSteps' | 'stepJourney' | 'starRating' | 'speedometer' | 'colorCircle';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface DashboardItem {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  visualType: VisualType;
  colorTheme: string;
  resetInterval: 'daily';
  lastUpdated: string;
}

export interface TemplateItem {
  title: string;
  targetValue: number;
  unit: string;
  visualType: VisualType;
  colorTheme: string;
}

export interface HistoryItem extends TemplateItem {
  id: string;
}

export interface Template {
  templateName: string;
  dashboards: TemplateItem[];
}

interface DashboardState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  dashboards: DashboardItem[];
  history: HistoryItem[];
  addDashboard: (dashboard: Omit<DashboardItem, 'id' | 'lastUpdated' | 'currentValue'>) => void;
  addToHistory: (item: Omit<HistoryItem, 'id'>) => void;
  removeFromHistory: (id: string) => void;
  updateDashboard: (id: string, updates: Partial<DashboardItem>) => void;
  removeDashboard: (id: string) => void;
  incrementValue: (id: string, amount?: number) => void;
  decrementValue: (id: string, amount?: number) => void;
  importTemplate: (template: Template) => void;
  clearAll: () => void;
  checkDailyReset: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      dashboards: [],
      history: [],

      addDashboard: (dashboard) => {
        set((state) => ({
          dashboards: [
            ...state.dashboards,
            {
              ...dashboard,
              id: Crypto.randomUUID(),
              currentValue: 0,
              lastUpdated: new Date().toISOString(),
            },
          ],
        }));
      },

      addToHistory: (item) => {
        set((state) => ({
          history: [
            { ...item, id: Crypto.randomUUID() },
            ...state.history,
          ],
        }));
      },

      removeFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        }));
      },

      updateDashboard: (id, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      removeDashboard: (id) => {
        set((state) => ({
          dashboards: state.dashboards.filter((d) => d.id !== id),
        }));
      },

      incrementValue: (id, amount = 1) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id
              ? {
                  ...d,
                  currentValue: Math.min(d.targetValue, d.currentValue + amount),
                  lastUpdated: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      decrementValue: (id, amount = 1) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id
              ? {
                  ...d,
                  currentValue: Math.max(0, d.currentValue - amount),
                  lastUpdated: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      importTemplate: (template) => {
        const newDashboards: DashboardItem[] = template.dashboards.map((t) => ({
          id: Crypto.randomUUID(),
          title: t.title,
          currentValue: 0,
          targetValue: t.targetValue,
          unit: t.unit,
          visualType: t.visualType,
          colorTheme: t.colorTheme,
          resetInterval: 'daily',
          lastUpdated: new Date().toISOString(),
        }));

        set((state) => ({
          dashboards: [...state.dashboards, ...newDashboards],
        }));
      },

      clearAll: () => {
        set({ dashboards: [] });
      },

      checkDailyReset: () => {
        const todayStr = new Date().toDateString();
        set((state) => ({
          dashboards: state.dashboards.map((d) => {
            const lastUpdatedStr = new Date(d.lastUpdated).toDateString();
            if (lastUpdatedStr !== todayStr && d.resetInterval === 'daily') {
              return {
                ...d,
                currentValue: 0,
                lastUpdated: new Date().toISOString(),
              };
            }
            return d;
          }),
        }));
      },
    }),
    {
      name: 'community-dash-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => key !== '_hasHydrated')
      ) as DashboardState,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);