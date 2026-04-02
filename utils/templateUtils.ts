import LZString from 'lz-string';
import { Template, DashboardItem } from '../store/dashboardStore';

export const exportTemplate = (templateName: string, dashboards: DashboardItem[]): string => {
  const template: Template = {
    templateName,
    dashboards: dashboards.map(d => ({
      title: d.title,
      targetValue: d.targetValue,
      unit: d.unit,
      visualType: d.visualType,
      colorTheme: d.colorTheme,
    })),
  };
  
  const jsonString = JSON.stringify(template);
  return LZString.compressToBase64(jsonString);
};

export const importTemplateFromString = (base64String: string): Template | null => {
  try {
    const jsonString = LZString.decompressFromBase64(base64String);
    if (!jsonString) return null;
    
    const parsed = JSON.parse(jsonString) as Template;
    
    // Basic validation
    if (parsed && typeof parsed.templateName === 'string' && Array.isArray(parsed.dashboards)) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error("Failed to parse template string", e);
    return null;
  }
};
