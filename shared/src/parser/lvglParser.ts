import { LvglConfig, LvglWidget, LvglWidgetType, ValidationIssue } from '../types/project.js';

const KNOWN_WIDGET_TYPES = new Set<string>([
  'label',
  'button',
  'slider',
  'switch',
  'checkbox',
  'textarea',
  'bar',
  'arc',
  'dropdown',
  'container',
  'obj',
  'tileview',
  'tiles',
  'meter',
  'image',
  'page',
  'tabview'
]);

let widgetCounter = 0;

function parseHexColor(val: any): string | undefined {
  if (typeof val === 'number') {
    return '#' + val.toString(16).padStart(6, '0');
  }
  if (typeof val === 'string') {
    if (val.startsWith('0x') || val.startsWith('0X')) {
      return '#' + val.slice(2).padStart(6, '0');
    }
    return val;
  }
  return undefined;
}

function parseTextValue(rawText: any): string | undefined {
  if (typeof rawText === 'string') return rawText;
  if (typeof rawText === 'number') return String(rawText);
  if (rawText && typeof rawText === 'object') {
    if (rawText.time_format) return rawText.time_format;
    if (rawText.format) return rawText.format;
  }
  return undefined;
}

function parseSingleWidget(raw: any, issues: ValidationIssue[]): LvglWidget | null {
  if (!raw || typeof raw !== 'object') return null;

  let key = Object.keys(raw)[0];
  let val = raw[key];

  let typeStr = key;
  let widgetData = val || {};

  if (raw.type && typeof raw.type === 'string') {
    typeStr = raw.type;
    widgetData = raw;
  }

  let normalizedType: LvglWidgetType = KNOWN_WIDGET_TYPES.has(typeStr)
    ? (typeStr as LvglWidgetType)
    : 'unknown';

  if (typeStr === 'obj') {
    normalizedType = 'container';
  }

  if (normalizedType === 'unknown') {
    issues.push({
      type: 'WARNING',
      message: `Unknown or custom LVGL widget type encountered: "${typeStr}". Rendering fallback placeholder.`
    });
  }

  widgetCounter++;
  const id = widgetData.id || `${typeStr}_${widgetCounter}`;

  const x = typeof widgetData.x === 'number' ? widgetData.x : 0;
  const y = typeof widgetData.y === 'number' ? widgetData.y : 0;
  const width = typeof widgetData.width === 'number' ? widgetData.width : undefined;
  const height = typeof widgetData.height === 'number' ? widgetData.height : undefined;
  const text = parseTextValue(widgetData.text) || parseTextValue(widgetData.label);

  const value = typeof widgetData.value === 'number' ? widgetData.value : undefined;
  const minValue = typeof widgetData.min_value === 'number' ? widgetData.min_value : undefined;
  const maxValue = typeof widgetData.max_value === 'number' ? widgetData.max_value : undefined;
  const checked = typeof widgetData.checked === 'boolean' ? widgetData.checked : (widgetData.state === 'ON');

  let options: string[] | undefined = undefined;
  if (Array.isArray(widgetData.options)) {
    options = widgetData.options.map(String);
  } else if (typeof widgetData.options === 'string') {
    options = widgetData.options.split('\n').filter(Boolean);
  }

  const styleObj: any = { ...widgetData.style };
  if (widgetData.bg_color) styleObj.bg_color = parseHexColor(widgetData.bg_color);
  if (widgetData.text_color) styleObj.text_color = parseHexColor(widgetData.text_color);
  if (widgetData.radius !== undefined) styleObj.radius = widgetData.radius;
  if (widgetData.border_width !== undefined) styleObj.border_width = widgetData.border_width;
  if (widgetData.align) styleObj.align = widgetData.align;

  const childrenRaw = widgetData.widgets || widgetData.children || widgetData.tiles;
  const children: LvglWidget[] = [];
  if (Array.isArray(childrenRaw)) {
    for (const childRaw of childrenRaw) {
      // Handle tile elements which are directly object definitions like { id: 'canvas_1', ... }
      if (childRaw && typeof childRaw === 'object' && childRaw.id && !KNOWN_WIDGET_TYPES.has(Object.keys(childRaw)[0])) {
        const tileWidget = parseSingleWidget({ container: childRaw }, issues);
        if (tileWidget) children.push(tileWidget);
      } else {
        const childWidget = parseSingleWidget(childRaw, issues);
        if (childWidget) children.push(childWidget);
      }
    }
  }

  return {
    id,
    type: normalizedType,
    x,
    y,
    width,
    height,
    text,
    value,
    minValue,
    maxValue,
    checked,
    options,
    selectedIndex: typeof widgetData.selected === 'number' ? widgetData.selected : 0,
    style: styleObj,
    properties: widgetData,
    children: children.length > 0 ? children : undefined
  };
}

export function parseLvgl(yamlObj: any): { lvgl: LvglConfig; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  widgetCounter = 0;

  const rawLvgl = yamlObj?.lvgl || {};
  const rawWidgets = rawLvgl.widgets || yamlObj?.widgets || [];

  const widgets: LvglWidget[] = [];

  if (Array.isArray(rawWidgets)) {
    for (const item of rawWidgets) {
      const widget = parseSingleWidget(item, issues);
      if (widget) {
        widgets.push(widget);
      }
    }
  }

  if (widgets.length === 0) {
    issues.push({
      type: 'INFO',
      message: 'No LVGL widgets defined in YAML.'
    });
  } else {
    issues.push({
      type: 'INFO',
      message: `Parsed ${widgets.length} LVGL widget(s).`
    });
  }

  return {
    lvgl: {
      displays: rawLvgl.displays || [],
      widgets
    },
    issues
  };
}
