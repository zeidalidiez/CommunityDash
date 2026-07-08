import {
  applyIncrement,
  applyDecrement,
  processDailyReset,
  buildSnapshotFromDashboards,
  upsertTodaySnapshot,
  calculateMasterTally,
  upsertHistory,
  emptyDomainState,
  clearHistorySnapshots,
  buildBackupPayload,
  parseBackupPayload,
  migratePersistedState,
  DashboardItem,
  SCHEMA_VERSION,
} from '../utils/dashboardLogic';
import {
  exportTemplate,
  importTemplateFromString,
  importTemplateResult,
} from '../utils/templateUtils';

function sampleItem(overrides: Partial<DashboardItem> = {}): DashboardItem {
  return {
    id: 'g1',
    title: 'Water',
    currentValue: 0,
    targetValue: 8,
    stepSize: 2,
    unit: 'glasses',
    visualType: 'liquidWave',
    colorTheme: '#3498db',
    resetInterval: 'daily',
    createdAt: '2026-07-01T10:00:00.000Z',
    lastUpdated: '2026-07-01T10:00:00.000Z',
    sortOrder: 0,
    ...overrides,
  };
}

describe('stepSize increments', () => {
  test('applyIncrement uses stepSize by default', () => {
    const item = sampleItem({ currentValue: 0, stepSize: 3 });
    const next = applyIncrement(item);
    expect(next.currentValue).toBe(3);
  });

  test('applyIncrement accepts explicit amount', () => {
    const next = applyIncrement(sampleItem({ currentValue: 1 }), 5);
    expect(next.currentValue).toBe(6);
  });

  test('applyDecrement floors at 0', () => {
    const next = applyDecrement(sampleItem({ currentValue: 1, stepSize: 5 }));
    expect(next.currentValue).toBe(0);
  });
});

describe('over-target not capped', () => {
  test('currentValue may exceed targetValue', () => {
    const item = sampleItem({ currentValue: 8, targetValue: 8, stepSize: 1 });
    const next = applyIncrement(item);
    expect(next.currentValue).toBe(9);
    expect(next.currentValue).toBeGreaterThan(next.targetValue);
  });

  test('master tally counts over-target as met', () => {
    const dashboards = [
      sampleItem({ id: 'a', currentValue: 10, targetValue: 8 }),
      sampleItem({ id: 'b', currentValue: 3, targetValue: 8 }),
    ];
    const tally = calculateMasterTally(dashboards);
    expect(tally.completed).toBe(1);
    expect(tally.total).toBe(2);
  });
});

describe('daily reset finalizes snapshot then zeros', () => {
  test('new day writes prior snapshot and zeros values', () => {
    const dashboards = [
      sampleItem({
        id: 'g1',
        currentValue: 6,
        targetValue: 8,
        lastUpdated: '2026-07-07T18:00:00.000Z',
      }),
      sampleItem({
        id: 'g2',
        currentValue: 8,
        targetValue: 8,
        lastUpdated: '2026-07-07T19:00:00.000Z',
      }),
    ];
    const result = processDailyReset({
      dashboards,
      dailySnapshots: [],
      lastResetDate: '2026-07-07',
      today: '2026-07-08',
      nowIso: '2026-07-08T08:00:00.000Z',
    });

    expect(result.didReset).toBe(true);
    expect(result.lastResetDate).toBe('2026-07-08');
    expect(result.dashboards.every((d) => d.currentValue === 0)).toBe(true);

    const prior = result.dailySnapshots.find((s) => s.date === '2026-07-07');
    expect(prior).toBeDefined();
    expect(prior!.completedCount).toBe(1);
    expect(prior!.totalCount).toBe(2);
    expect(prior!.goals.g1.currentValue).toBe(6);
    expect(prior!.goals.g2.completed).toBe(true);

    const todaySnap = result.dailySnapshots.find((s) => s.date === '2026-07-08');
    expect(todaySnap).toBeDefined();
    expect(todaySnap!.goals.g1.currentValue).toBe(0);
  });

  test('same day does not reset', () => {
    const dashboards = [sampleItem({ currentValue: 4 })];
    const result = processDailyReset({
      dashboards,
      dailySnapshots: [],
      lastResetDate: '2026-07-08',
      today: '2026-07-08',
    });
    expect(result.didReset).toBe(false);
    expect(result.dashboards[0].currentValue).toBe(4);
  });
});

describe('template compress round-trip', () => {
  test('export then import preserves v1 payload fields', () => {
    const dashboards = [
      sampleItem({ title: 'Water', targetValue: 16, stepSize: 2, unit: 'glasses' }),
      sampleItem({
        id: 'g2',
        title: 'Pushups',
        targetValue: 50,
        stepSize: 5,
        unit: 'reps',
        visualType: 'batteryCore',
        colorTheme: '#e74c3c',
      }),
    ];
    const code = exportTemplate('Hydration Station', dashboards);
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(10);

    const imported = importTemplateFromString(code);
    expect(imported).not.toBeNull();
    expect(imported!.templateName).toBe('Hydration Station');
    expect(imported!.dashboards).toHaveLength(2);
    expect(imported!.dashboards[0].title).toBe('Water');
    expect(imported!.dashboards[0].stepSize).toBe(2);
    expect(imported!.dashboards[1].visualType).toBe('batteryCore');
    // no currentValue in template
    expect((imported!.dashboards[0] as any).currentValue).toBeUndefined();
  });

  test('unknown visualType falls back to liquidWave', () => {
    // Build payload with bad visual via re-export path: craft through LZ by importing after patching
    const good = exportTemplate('T', [sampleItem()]);
    const result = importTemplateResult(good);
    expect(result.ok).toBe(true);

    // Directly test normalize via import of crafted compressed string
    const LZString = require('lz-string');
    const payload = {
      v: 1,
      templateName: 'X',
      dashboards: [
        {
          title: 'A',
          targetValue: 5,
          stepSize: 1,
          unit: '',
          visualType: 'notARealVisual',
          colorTheme: '#000',
        },
      ],
    };
    const code = LZString.compressToBase64(JSON.stringify(payload));
    const imported = importTemplateFromString(code);
    expect(imported).not.toBeNull();
    expect(imported!.dashboards[0].visualType).toBe('liquidWave');
  });

  test('invalid import returns null / structured error', () => {
    expect(importTemplateFromString('not-valid!!!')).toBeNull();
    const bad = importTemplateResult('%%%');
    expect(bad.ok).toBe(false);

    const empty = importTemplateResult('');
    expect(empty.ok).toBe(false);

    const LZString = require('lz-string');
    const noName = LZString.compressToBase64(
      JSON.stringify({ v: 1, dashboards: [{ title: 'A', targetValue: 1 }] })
    );
    expect(importTemplateResult(noName).ok).toBe(false);

    const badItem = LZString.compressToBase64(
      JSON.stringify({
        v: 1,
        templateName: 'T',
        dashboards: [{ title: '', targetValue: -1 }],
      })
    );
    expect(importTemplateResult(badItem).ok).toBe(false);
  });
});

describe('clearAll / clearHistory domains', () => {
  test('emptyDomainState clears all domains', () => {
    const empty = emptyDomainState();
    expect(empty.dashboards).toEqual([]);
    expect(empty.history).toEqual([]);
    expect(empty.templates).toEqual([]);
    expect(empty.dailySnapshots).toEqual([]);
    expect(empty.lastResetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('clearHistorySnapshots only clears chart snapshots', () => {
    const snaps = [
      buildSnapshotFromDashboards('2026-07-01', [sampleItem({ currentValue: 8 })]),
    ];
    expect(clearHistorySnapshots(snaps)).toEqual([]);
  });

  test('backup payload includes all domains and parse works', () => {
    const payload = buildBackupPayload({
      theme: 'dark',
      dashboards: [sampleItem()],
      history: [],
      templates: [],
      dailySnapshots: [],
      lastResetDate: '2026-07-08',
    });
    expect(payload.schemaVersion).toBe(SCHEMA_VERSION);
    expect(payload.dashboards).toHaveLength(1);
    const raw = JSON.stringify(payload);
    const parsed = parseBackupPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.theme).toBe('dark');
    expect(parseBackupPayload('nope')).toBeNull();
  });
});

describe('history upsert and migration', () => {
  test('upsertHistory dedupes and refreshes lastUsedAt', () => {
    let history = upsertHistory(
      [],
      {
        title: 'Water',
        targetValue: 8,
        stepSize: 1,
        unit: 'glasses',
        visualType: 'liquidWave',
        colorTheme: '#3498db',
      },
      'h1',
      '2026-07-01T00:00:00.000Z'
    );
    expect(history).toHaveLength(1);
    history = upsertHistory(
      history,
      {
        title: 'Water',
        targetValue: 8,
        stepSize: 1,
        unit: 'glasses',
        visualType: 'liquidWave',
        colorTheme: '#3498db',
      },
      'h2',
      '2026-07-02T00:00:00.000Z'
    );
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('h1');
    expect(history[0].lastUsedAt).toBe('2026-07-02T00:00:00.000Z');
  });

  test('migrate adds stepSize defaults to legacy dashboards', () => {
    const migrated = migratePersistedState({
      dashboards: [
        {
          id: 'old',
          title: 'Legacy',
          currentValue: 2,
          targetValue: 5,
          unit: 'x',
          visualType: 'neonGlow',
          colorTheme: '#fff',
          resetInterval: 'daily',
          lastUpdated: '2026-01-01T00:00:00.000Z',
        },
      ],
      theme: 'light',
    });
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);
    expect(migrated.dashboards[0].stepSize).toBe(1);
    expect(migrated.dashboards[0].sortOrder).toBe(0);
    expect(migrated.templates).toEqual([]);
    expect(migrated.dailySnapshots).toEqual([]);
  });
});

describe('upsertTodaySnapshot', () => {
  test('updates same date in place', () => {
    let snaps = upsertTodaySnapshot([], [sampleItem({ currentValue: 1 })], '2026-07-08');
    expect(snaps).toHaveLength(1);
    snaps = upsertTodaySnapshot(
      snaps,
      [sampleItem({ currentValue: 4 })],
      '2026-07-08'
    );
    expect(snaps).toHaveLength(1);
    expect(snaps[0].goals.g1.currentValue).toBe(4);
  });
});
