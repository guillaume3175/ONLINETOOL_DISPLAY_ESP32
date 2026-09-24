export interface BoardConfig {
  id?: string;
  name?: string;
  platform?: string;
  board?: string;
  mcu?: string;
}

export interface DisplayConfig {
  id: string;
  platform?: string;
  model?: string;
  driver?: string;
  width: number;
  height: number;
  rotation: number;
  busType?: 'SPI' | 'I2C' | '8-bit Parallel' | '16-bit Parallel' | 'RGB' | 'Unknown';
  colorDepth?: number;
  backlightPin?: string | number;
  spiCsPin?: string | number;
  spiDcPin?: string | number;
  spiRstPin?: string | number;
  i2cSdaPin?: string | number;
  i2cSclPin?: string | number;
}

export interface TouchConfig {
  id: string;
  platform?: string;
  model?: string;
  driver?: string;
  busType?: 'I2C' | 'SPI' | 'Unknown';
  i2cSdaPin?: string | number;
  i2cSclPin?: string | number;
  interruptPin?: string | number;
  resetPin?: string | number;
}

export type LvglWidgetType =
  | 'label'
  | 'button'
  | 'slider'
  | 'switch'
  | 'checkbox'
  | 'textarea'
  | 'bar'
  | 'arc'
  | 'dropdown'
  | 'container'
  | 'obj'
  | 'tileview'
  | 'tiles'
  | 'tile'
  | 'meter'
  | 'image'
  | 'page'
  | 'tabview'
  | 'unknown';

export interface LvglWidget {
  id: string;
  type: LvglWidgetType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  value?: number;
  minValue?: number;
  maxValue?: number;
  checked?: boolean;
  options?: string[];
  selectedIndex?: number;
  style?: {
    bg_color?: string;
    text_color?: string;
    border_color?: string;
    border_width?: number;
    radius?: number;
    align?: string;
  };
  properties: Record<string, unknown>;
  children?: LvglWidget[];
}

export interface LvglConfig {
  displays?: string[];
  touchscreens?: string[];
  pageWrap?: boolean;
  widgets: LvglWidget[];
}

export interface ValidationIssue {
  type: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  path?: string;
  line?: number;
}

export interface Esp32Project {
  name: string;
  board: BoardConfig;
  display: DisplayConfig;
  touchscreen?: TouchConfig;
  lvgl: LvglConfig;
  rawYaml: string;
  validationIssues: ValidationIssue[];
}
