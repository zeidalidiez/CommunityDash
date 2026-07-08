import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { toLocalDateString } from '../utils/dateUtils';
import {
  SCHEMA_VERSION,
  DashboardItem,
  HistoryItem,
  NamedTemplate,
  DailySnapshot,
  TemplateItem,
  VisualType,
  applyIncrement,
  applyDecrement,
  processDailyReset,
  upsertTodaySnapshot,
  upsertHistory,
  migratePersistedState,
  buildBackupPayload,
  parseBackupPayload,
  emptyDomainState,
  applyClearHistory,
  applyClearAllDomains,
  normalizeStepSize,
  BackupPayload,
} from '../utils/dashboardLogic';

export type { VisualType, DashboardItem, HistoryItem, NamedTemplate, DailySnapshot, TemplateItem, BackupPayload };
export type ThemeMode = 'system' | 'light' | 'dark';

// Re-export Template shape used by older imports
export interface Template {
  templateName: string;
  dashboards: TemplateItem[];
}

interface DashboardState {
  schemaVersion: number;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  dashboards: DashboardItem[];
  history: HistoryItem[];
  templates: NamedTemplate[];
  dailySnapshots: DailySnapshot[];
  lastResetDate: string;

  addDashboard: (
    dashboard: Omit<
      DashboardItem,
      'id' | 'lastUpdated' | 'currentValue' | 'createdAt' | 'sortOrder'
    > & { stepSize?: number }
  ) => void;
  updateDashboard: (id: string, updates: Partial<DashboardItem>) => void;
  removeDashboard: (id: string) => void;
  incrementValue: (id: string, amount?: number) => void;
  decrementValue: (id: string, amount?: number) => void;

  addToHistory: (item: Omit<HistoryItem, 'id' | 'lastUsedAt'>) => void;
  removeFromHistory: (id: string) => void;

  saveTemplate: (templateName: string, fromDashboards?: DashboardItem[]) => string | null;
  deleteTemplate: (id: string) => void;
  applyTemplate: (id: string) => void;
  importTemplate: (template: Template) => void;
  renameTemplate: (id: string, templateName: string) => void;

  checkDailyReset: () => void;
  clearHistory: () => void;
  clearAll: () => void;
  exportBackup: () => string;
  importBackup: (json: string) => boolean;
}

function newId(): string {
  return Crypto.randomUUID();
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      dashboards: [],
      history: [],
      templates: [],
      dailySnapshots: [],
      lastResetDate: toLocalDateString(),

      addDashboard: (dashboard) => {
        const id = newId();
        const now = new Date().toISOString();
        const stepSize = normalizeStepSize(dashboard.stepSize, 1);
        set((state) => {
          const maxOrder = state.dashboards.reduce(
            (m, d) => Math.max(m, d.sortOrder),
            -1
          );
          const item: DashboardItem = {
            id,
            title: dashboard.title,
            currentValue: 0,
            targetValue: dashboard.targetValue,
            stepSize,
            unit: dashboard.unit,
            visualType: dashboard.visualType,
            colorTheme: dashboard.colorTheme,
            resetInterval: dashboard.resetInterval ?? 'daily',
            createdAt: now,
            lastUpdated: now,
            sortOrder: maxOrder + 1,
          };
          const dashboards = [...state.dashboards, item];
          return {
            dashboards,
            dailySnapshots: upsertTodaySnapshot(
              state.dailySnapshots,
              dashboards,
              toLocalDateString()
            ),
          };
        });
      },

      updateDashboard: (id, updates) => {
        set((state) => {
          const dashboards = state.dashboards.map((d) => {
            if (d.id !== id) return d;
            const next = { ...d, ...updates, id: d.id };
            if (updates.stepSize != null) {
              next.stepSize = normalizeStepSize(updates.stepSize, d.stepSize);
            }
            if (updates.targetValue != null) {
              next.targetValue =
                Number(updates.targetValue) > 0 ? Number(updates.targetValue) : d.targetValue;
            }
            next.lastUpdated = new Date().toISOString();
            return next;
          });
          return {
            dashboards,
            dailySnapshots: upsertTodaySnapshot(
              state.dailySnapshots,
              dashboards,
              toLocalDateString()
            ),
          };
        });
      },

      removeDashboard: (id) => {
        set((state) => {
          const dashboards = state.dashboards.filter((d) => d.id !== id);
          return {
            dashboards,
            dailySnapshots: upsertTodaySnapshot(
              state.dailySnapshots,
              dashboards,
              toLocalDateString()
            ),
          };
        });
      },

      incrementValue: (id, amount) => {
        set((state) => {
          const dashboards = state.dashboards.map((d) =>
            d.id === id ? applyIncrement(d, amount) : d
          );
          return {
            dashboards,
            dailySnapshots: upsertTodaySnapshot(
              state.dailySnapshots,
              dashboards,
              toLocalDateString()
            ),
          };
        });
      },

      decrementValue: (id, amount) => {
        set((state) => {
          const dashboards = state.dashboards.map((d) =>
            d.id === id ? applyDecrement(d, amount) : d
          );
          return {
            dashboards,
            dailySnapshots: upsertTodaySnapshot(
              state.dailySnapshots,
              dashboards,
              toLocalDateString()
            ),
          };
        });
      },

      addToHistory: (item) => {
        set((state) => ({
          history: upsertHistory(state.history, item, newId()),
        }));
      },

      removeFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        }));
      },

      saveTemplate: (templateName, fromDashboards) => {
        const name = templateName.trim();
        if (!name) return null;
        const source = fromDashboards ?? get().dashboards;
        if (source.length === 0) return null;
        const id = newId();
        const tpl: NamedTemplate = {
          id,
          templateName: name,
          createdAt: new Date().toISOString(),
          dashboards: source.map((d) => ({
            title: d.title,
            targetValue: d.targetValue,
            stepSize: normalizeStepSize(d.stepSize, 1),
            unit: d.unit,
            visualType: d.visualType,
            colorTheme: d.colorTheme,
          })),
        };
        set((state) => ({ templates: [tpl, ...state.templates] }));
        return id;
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      renameTemplate: (id, templateName) => {
        const name = templateName.trim();
        if (!name) return;
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, templateName: name } : t
          ),
        }));
      },

      applyTemplate: (id) => {
        const tpl = get().templates.find((t) => t.id === id);
        if (!tpl) return;
        get().importTemplate({
          templateName: tpl.templateName,
          dashboards: tpl.dashboards,
        });
      },

      importTemplate: (template) => {
        const now = new Date().toISOString();
        set((state) => {
          const maxOrder = state.dashboards.reduce(
            (m, d) => Math.max(m, d.sortOrder),
            -1
          );
          const newDashboards: DashboardItem[] = template.dashboards.map((t, i) => ({
            id: newId(),
            title: t.title,
            currentValue: 0,
            targetValue: t.targetValue,
            stepSize: normalizeStepSize(t.stepSize, 1),
            unit: t.unit,
            visualType: t.visualType,
            colorTheme: t.colorTheme,
            resetInterval: 'daily' as const,
            createdAt: now,
            lastUpdated: now,
            sortOrder: maxOrder + 1 + i,
          }));
          const dashboards = [...state.dashboards, ...newDashboards];
          return {
            dashboards,
            dailySnapshots: upsertTodaySnapshot(
              state.dailySnapshots,
              dashboards,
              toLocalDateString()
            ),
          };
        });
      },

      checkDailyReset: () => {
        const state = get();
        const result = processDailyReset({
          dashboards: state.dashboards,
          dailySnapshots: state.dailySnapshots,
          lastResetDate: state.lastResetDate,
        });
        if (result.didReset) {
          set({
            dashboards: result.dashboards,
            dailySnapshots: result.dailySnapshots,
            lastResetDate: result.lastResetDate,
          });
        }
      },

      clearHistory: () => {
        set((state) => applyClearHistory(state));
      },

      clearAll: () => {
        set({
          ...applyClearAllDomains(),
          schemaVersion: SCHEMA_VERSION,
        });
      },

      exportBackup: () => {
        const state = get();
        return JSON.stringify(
          buildBackupPayload({
            theme: state.theme,
            dashboards: state.dashboards,
            history: state.history,
            templates: state.templates,
            dailySnapshots: state.dailySnapshots,
            lastResetDate: state.lastResetDate,
          }),
          null,
          2
        );
      },

      importBackup: (json) => {
        const payload = parseBackupPayload(json);
        if (!payload) return false;
        const migrated = migratePersistedState(payload as unknown as Record<string, unknown>);
        set({
          schemaVersion: SCHEMA_VERSION,
          theme: (migrated.theme as ThemeMode) || 'system',
          dashboards: migrated.dashboards,
          history: migrated.history,
          templates: migrated.templates,
          dailySnapshots: migrated.dailySnapshots,
          lastResetDate: migrated.lastResetDate || toLocalDateString(),
        });
        return true;
      },
    }),
    {
      name: 'community-dash-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: SCHEMA_VERSION,
      migrate: (persisted: any) => {
        const migrated = migratePersistedState(persisted ?? {});
        return {
          ...migrated,
          _hasHydrated: false,
        };
      },
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        theme: state.theme,
        dashboards: state.dashboards,
        history: state.history,
        templates: state.templates,
        dailySnapshots: state.dailySnapshots,
        lastResetDate: state.lastResetDate,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
