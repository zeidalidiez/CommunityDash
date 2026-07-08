import LZString from 'lz-string';
import {
  NamedTemplate,
  TemplateItem,
  DashboardItem,
  normalizeStepSize,
  normalizeVisualType,
  KNOWN_VISUAL_TYPES,
  VisualType,
} from './dashboardLogic';

export const TEMPLATE_PAYLOAD_VERSION = 1;

export interface ShareTemplatePayload {
  v: number;
  templateName: string;
  dashboards: TemplateItem[];
}

export type ImportResult =
  | { ok: true; template: { templateName: string; dashboards: TemplateItem[] } }
  | { ok: false; error: string };

function toTemplateItem(d: Partial<TemplateItem> | DashboardItem): TemplateItem {
  return {
    title: String(d.title ?? '').trim() || 'Goal',
    targetValue: Number(d.targetValue) > 0 ? Number(d.targetValue) : 1,
    stepSize: normalizeStepSize((d as TemplateItem).stepSize, 1),
    unit: String(d.unit ?? ''),
    visualType: normalizeVisualType(d.visualType),
    colorTheme: String(d.colorTheme ?? '#3498db'),
  };
}

export function dashboardsToTemplateItems(dashboards: DashboardItem[]): TemplateItem[] {
  return dashboards.map((d) => toTemplateItem(d));
}

export function exportTemplate(
  templateName: string,
  dashboards: DashboardItem[] | TemplateItem[]
): string {
  const payload: ShareTemplatePayload = {
    v: TEMPLATE_PAYLOAD_VERSION,
    templateName: templateName.trim() || 'My Dashboards',
    dashboards: dashboards.map((d) => toTemplateItem(d)),
  };
  return LZString.compressToBase64(JSON.stringify(payload));
}

export function exportNamedTemplate(template: NamedTemplate): string {
  return exportTemplate(template.templateName, template.dashboards);
}

function validateTemplateItems(items: unknown): TemplateItem[] | null {
  if (!Array.isArray(items)) return null;
  const out: TemplateItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const title = typeof r.title === 'string' ? r.title.trim() : '';
    const targetValue = Number(r.targetValue);
    if (!title || !Number.isFinite(targetValue) || targetValue <= 0) {
      return null;
    }
    // Unknown visualType falls back; invalid non-string becomes liquidWave
    const visualType = normalizeVisualType(r.visualType);
    out.push({
      title,
      targetValue,
      stepSize: normalizeStepSize(r.stepSize, 1),
      unit: typeof r.unit === 'string' ? r.unit : '',
      visualType,
      colorTheme:
        typeof r.colorTheme === 'string' && r.colorTheme ? r.colorTheme : '#3498db',
    });
  }
  return out;
}

/**
 * Import share code. Returns null on hard failure (legacy helper),
 * or use importTemplateResult for structured errors.
 */
export function importTemplateFromString(
  base64String: string
): { templateName: string; dashboards: TemplateItem[] } | null {
  const result = importTemplateResult(base64String);
  return result.ok ? result.template : null;
}

export function importTemplateResult(base64String: string): ImportResult {
  if (!base64String || !base64String.trim()) {
    return { ok: false, error: 'Empty template string' };
  }
  try {
    const jsonString = LZString.decompressFromBase64(base64String.trim());
    if (!jsonString) {
      return { ok: false, error: 'Invalid or corrupted template string' };
    }
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Invalid template payload' };
    }
    if (typeof parsed.templateName !== 'string') {
      return { ok: false, error: 'Missing template name' };
    }
    const items = validateTemplateItems(parsed.dashboards);
    if (!items) {
      return { ok: false, error: 'Invalid dashboard items in template' };
    }
    // Accept v missing (legacy) or v === 1
    if (parsed.v != null && parsed.v !== TEMPLATE_PAYLOAD_VERSION) {
      return { ok: false, error: `Unsupported template version: ${parsed.v}` };
    }
    return {
      ok: true,
      template: {
        templateName: parsed.templateName,
        dashboards: items,
      },
    };
  } catch {
    return { ok: false, error: 'Failed to parse template string' };
  }
}

export function isKnownVisualType(v: string): v is VisualType {
  return (KNOWN_VISUAL_TYPES as string[]).includes(v);
}
