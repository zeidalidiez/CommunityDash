import { toLocalDateString } from './dateUtils';

export const SCHEMA_VERSION = 2;
export const HISTORY_CAP = 100;

export type VisualType =
  | 'liquidWave'
  | 'neonGlow'
  | 'batteryCore'
  | 'gradientBar'
  | 'pizzaSlices'
  | 'sunHorizon'
  | 'hourglass'
  | 'radarScope';

export const KNOWN_VISUAL_TYPES: VisualType[] = [
  'liquidWave',
  'neonGlow',
  'batteryCore',
  'gradientBar',
  'pizzaSlices',
  'sunHorizon',
  'hourglass',
  'radarScope',
];

export interface DashboardItem {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  stepSize: number;
  unit: string;
  visualType: VisualType;
  colorTheme: string;
  resetInterval: 'daily';
  createdAt: string;
  lastUpdated: string;
  sortOrder: number;
}

export interface TemplateItem {
  title: string;
  targetValue: number;
  stepSize: number;
  unit: string;
  visualType: VisualType;
  colorTheme: string;
}

export interface HistoryItem extends TemplateItem {
  id: string;
  lastUsedAt: string;
}

export interface NamedTemplate {
  id: string;
  templateName: string;
  createdAt: string;
  dashboards: TemplateItem[];
}

export interface GoalDaySnapshot {
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  colorTheme?: string;
}

export interface DailySnapshot {
  date: string;
  goals: Record<string, GoalDaySnapshot>;
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface BackupPayload {
  v: number;
  schemaVersion: number;
  exportedAt: string;
  theme: string;
  dashboards: DashboardItem[];
  history: HistoryItem[];
  templates: NamedTemplate[];
  dailySnapshots: DailySnapshot[];
  lastResetDate: string;
}

export function normalizeStepSize(step: unknown, fallback = 1): number {
  const n = typeof step === 'number' ? step : Number(step);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

export function applyIncrement(item: DashboardItem, amount?: number): DashboardItem {
  const delta = amount ?? item.stepSize ?? 1;
  return {
    ...item,
    currentValue: item.currentValue + delta,
    lastUpdated: new Date().toISOString(),
  };
}

export function applyDecrement(item: DashboardItem, amount?: number): DashboardItem {
  const delta = amount ?? item.stepSize ?? 1;
  return {
    ...item,
    currentValue: Math.max(0, item.currentValue - delta),
    lastUpdated: new Date().toISOString(),
  };
}

export function isGoalMet(item: { currentValue: number; targetValue: number }): boolean {
  return item.currentValue >= item.targetValue && item.targetValue > 0;
}

export function calculateMasterTally(dashboards: DashboardItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = dashboards.length;
  const completed = dashboards.filter(isGoalMet).length;
  return {
    completed,
    total,
    percentage: total > 0 ? (completed / total) * 100 : 0,
  };
}

export function buildSnapshotFromDashboards(
  date: string,
  dashboards: DashboardItem[]
): DailySnapshot {
  const goals: Record<string, GoalDaySnapshot> = {};
  for (const d of dashboards) {
    goals[d.id] = {
      title: d.title,
      currentValue: d.currentValue,
      targetValue: d.targetValue,
      unit: d.unit,
      completed: isGoalMet(d),
      colorTheme: d.colorTheme,
    };
  }
  const totalCount = dashboards.length;
  const completedCount = dashboards.filter(isGoalMet).length;
  return {
    date,
    goals,
    completedCount,
    totalCount,
    percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
  };
}

/** Upsert today's snapshot from current dashboard values. */
export function upsertTodaySnapshot(
  snapshots: DailySnapshot[],
  dashboards: DashboardItem[],
  today: string = toLocalDateString()
): DailySnapshot[] {
  const next = buildSnapshotFromDashboards(today, dashboards);
  const idx = snapshots.findIndex((s) => s.date === today);
  if (idx === -1) return [...snapshots, next].sort((a, b) => a.date.localeCompare(b.date));
  const copy = snapshots.slice();
  copy[idx] = next;
  return copy;
}

export interface ResetInput {
  dashboards: DashboardItem[];
  dailySnapshots: DailySnapshot[];
  lastResetDate: string;
  today?: string;
  nowIso?: string;
}

export interface ResetResult {
  dashboards: DashboardItem[];
  dailySnapshots: DailySnapshot[];
  lastResetDate: string;
  didReset: boolean;
}

/**
 * On a new local calendar day: finalize prior day's snapshot from last known
 * values (if missing), zero daily goals, set lastResetDate to today.
 */
export function processDailyReset(input: ResetInput): ResetResult {
  const today = input.today ?? toLocalDateString();
  if (input.lastResetDate === today) {
    return {
      dashboards: input.dashboards,
      dailySnapshots: input.dailySnapshots,
      lastResetDate: input.lastResetDate,
      didReset: false,
    };
  }

  let snapshots = input.dailySnapshots.slice();

  // If we have values from a previous day that were never snapshotted under that date, capture them.
  if (input.dashboards.length > 0) {
    if (input.lastResetDate && input.lastResetDate !== today) {
      const existingIdx = snapshots.findIndex((s) => s.date === input.lastResetDate);
      const snap = buildSnapshotFromDashboards(input.lastResetDate, input.dashboards);
      if (existingIdx === -1) {
        snapshots.push(snap);
      } else {
        snapshots[existingIdx] = snap;
      }
    } else if (!input.lastResetDate) {
      const needsFinalize = input.dashboards.some((d) => {
        const updatedDay = toLocalDateString(new Date(d.lastUpdated));
        return updatedDay !== today;
      });
      if (needsFinalize) {
        const days = new Set(
          input.dashboards.map((d) => toLocalDateString(new Date(d.lastUpdated)))
        );
        for (const day of days) {
          if (day !== today && !snapshots.some((s) => s.date === day)) {
            snapshots.push(buildSnapshotFromDashboards(day, input.dashboards));
          }
        }
      }
    }
  }

  snapshots = snapshots.sort((a, b) => a.date.localeCompare(b.date));

  const nowIso = input.nowIso ?? new Date().toISOString();
  const dashboards = input.dashboards.map((d) =>
    d.resetInterval === 'daily'
      ? { ...d, currentValue: 0, lastUpdated: nowIso }
      : d
  );

  // Seed today's zero snapshot
  snapshots = upsertTodaySnapshot(snapshots, dashboards, today);

  return {
    dashboards,
    dailySnapshots: snapshots,
    lastResetDate: today,
    didReset: true,
  };
}

export function historyFingerprint(item: TemplateItem): string {
  return [
    item.title.trim().toLowerCase(),
    item.targetValue,
    item.stepSize ?? 1,
    item.unit.trim().toLowerCase(),
    item.visualType,
    item.colorTheme,
  ].join('|');
}

/** Add or refresh a history item; cap at HISTORY_CAP (LRU by lastUsedAt). */
export function upsertHistory(
  history: HistoryItem[],
  item: Omit<HistoryItem, 'id' | 'lastUsedAt'> & { id?: string },
  newId: string,
  nowIso: string = new Date().toISOString()
): HistoryItem[] {
  const fp = historyFingerprint(item);
  const existingIdx = history.findIndex((h) => historyFingerprint(h) === fp);
  let next: HistoryItem[];
  if (existingIdx >= 0) {
    const existing = history[existingIdx];
    next = [
      { ...existing, ...item, id: existing.id, lastUsedAt: nowIso },
      ...history.filter((_, i) => i !== existingIdx),
    ];
  } else {
    next = [
      {
        id: item.id ?? newId,
        title: item.title,
        targetValue: item.targetValue,
        stepSize: normalizeStepSize(item.stepSize),
        unit: item.unit,
        visualType: item.visualType,
        colorTheme: item.colorTheme,
        lastUsedAt: nowIso,
      },
      ...history,
    ];
  }
  // Sort by lastUsedAt desc and cap
  next.sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  return next.slice(0, HISTORY_CAP);
}

export function normalizeVisualType(value: unknown): VisualType {
  if (typeof value === 'string' && (KNOWN_VISUAL_TYPES as string[]).includes(value)) {
    return value as VisualType;
  }
  return 'liquidWave';
}

export function migratePersistedState(raw: Record<string, unknown> | null | undefined): {
  schemaVersion: number;
  theme: string;
  dashboards: DashboardItem[];
  history: HistoryItem[];
  templates: NamedTemplate[];
  dailySnapshots: DailySnapshot[];
  lastResetDate: string;
} {
  const data = raw ?? {};
  const now = new Date().toISOString();
  const today = toLocalDateString();

  const dashboardsIn = Array.isArray(data.dashboards) ? data.dashboards : [];
  const dashboards: DashboardItem[] = dashboardsIn.map((d: any, index: number) => ({
    id: String(d.id ?? `migrated-${index}`),
    title: String(d.title ?? 'Goal'),
    currentValue: Number(d.currentValue) || 0,
    targetValue: Number(d.targetValue) > 0 ? Number(d.targetValue) : 1,
    stepSize: normalizeStepSize(d.stepSize, 1),
    unit: String(d.unit ?? ''),
    visualType: normalizeVisualType(d.visualType),
    colorTheme: String(d.colorTheme ?? '#3498db'),
    resetInterval: 'daily' as const,
    createdAt: String(d.createdAt ?? d.lastUpdated ?? now),
    lastUpdated: String(d.lastUpdated ?? now),
    sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : index,
  }));

  const historyIn = Array.isArray(data.history) ? data.history : [];
  const history: HistoryItem[] = historyIn.map((h: any, index: number) => ({
    id: String(h.id ?? `hist-${index}`),
    title: String(h.title ?? 'Goal'),
    targetValue: Number(h.targetValue) > 0 ? Number(h.targetValue) : 1,
    stepSize: normalizeStepSize(h.stepSize, 1),
    unit: String(h.unit ?? ''),
    visualType: normalizeVisualType(h.visualType),
    colorTheme: String(h.colorTheme ?? '#3498db'),
    lastUsedAt: String(h.lastUsedAt ?? now),
  }));

  const templatesIn = Array.isArray(data.templates) ? data.templates : [];
  const templates: NamedTemplate[] = templatesIn.map((t: any, index: number) => ({
    id: String(t.id ?? `tpl-${index}`),
    templateName: String(t.templateName ?? 'Template'),
    createdAt: String(t.createdAt ?? now),
    dashboards: Array.isArray(t.dashboards)
      ? t.dashboards.map((td: any) => ({
          title: String(td.title ?? 'Goal'),
          targetValue: Number(td.targetValue) > 0 ? Number(td.targetValue) : 1,
          stepSize: normalizeStepSize(td.stepSize, 1),
          unit: String(td.unit ?? ''),
          visualType: normalizeVisualType(td.visualType),
          colorTheme: String(td.colorTheme ?? '#3498db'),
        }))
      : [],
  }));

  const snapsIn = Array.isArray(data.dailySnapshots) ? data.dailySnapshots : [];
  const dailySnapshots: DailySnapshot[] = snapsIn
    .filter((s: any) => s && typeof s.date === 'string')
    .map((s: any) => ({
      date: s.date,
      goals: s.goals && typeof s.goals === 'object' ? s.goals : {},
      completedCount: Number(s.completedCount) || 0,
      totalCount: Number(s.totalCount) || 0,
      percentage: Number(s.percentage) || 0,
    }));

  return {
    schemaVersion: SCHEMA_VERSION,
    theme: typeof data.theme === 'string' ? data.theme : 'system',
    dashboards,
    history,
    templates,
    dailySnapshots,
    lastResetDate: typeof data.lastResetDate === 'string' ? data.lastResetDate : today,
  };
}

export function buildBackupPayload(state: {
  theme: string;
  dashboards: DashboardItem[];
  history: HistoryItem[];
  templates: NamedTemplate[];
  dailySnapshots: DailySnapshot[];
  lastResetDate: string;
}): BackupPayload {
  return {
    v: 1,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    theme: state.theme,
    dashboards: state.dashboards,
    history: state.history,
    templates: state.templates,
    dailySnapshots: state.dailySnapshots,
    lastResetDate: state.lastResetDate,
  };
}

export function parseBackupPayload(raw: string): BackupPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.dashboards)) return null;
    return parsed as BackupPayload;
  } catch {
    return null;
  }
}

/** Clear chart snapshots only. */
export function clearHistorySnapshots(snapshots: DailySnapshot[]): DailySnapshot[] {
  return [];
}

export function emptyDomainState() {
  return {
    dashboards: [] as DashboardItem[],
    history: [] as HistoryItem[],
    templates: [] as NamedTemplate[],
    dailySnapshots: [] as DailySnapshot[],
    lastResetDate: toLocalDateString(),
  };
}
