import { parse } from 'yaml';
import { Esp32Project, ValidationIssue, BoardConfig } from '../types/project.js';
import { detectDisplay } from './displayDetector.js';
import { detectTouchscreen } from './touchDetector.js';
import { parseLvgl } from './lvglParser.js';

export function parseYamlToProject(rawYaml: string): Esp32Project {
  const issues: ValidationIssue[] = [];

  let parsedYaml: any = {};
  try {
    parsedYaml = parse(rawYaml) || {};
    issues.push({
      type: 'INFO',
      message: 'YAML syntax successfully validated.'
    });
  } catch (err: any) {
    issues.push({
      type: 'ERROR',
      message: `YAML Parse Error: ${err.message}`
    });
    return {
      name: 'Error Project',
      board: { platform: 'Unknown', board: 'Unknown' },
      display: { id: 'default', width: 172, height: 320, rotation: 0 },
      lvgl: { widgets: [] },
      rawYaml,
      validationIssues: issues
    };
  }

  const esphomeConfig = parsedYaml.esphome || {};
  const esp32Config = parsedYaml.esp32 || {};
  const board: BoardConfig = {
    id: esphomeConfig.name || 'esp32_device',
    name: esphomeConfig.name || 'ESP32 Device',
    platform: 'esp32',
    board: esp32Config.board || 'Unknown',
    mcu: esp32Config.variant || esp32Config.framework?.type || 'ESP32-S3'
  };

  const displayResult = detectDisplay(parsedYaml);
  const touchResult = detectTouchscreen(parsedYaml);
  const lvglResult = parseLvgl(parsedYaml);

  issues.push(...displayResult.issues, ...touchResult.issues, ...lvglResult.issues);

  return {
    name: board.name || 'ESP32 Project',
    board,
    display: displayResult.display,
    touchscreen: touchResult.touchscreen,
    lvgl: lvglResult.lvgl,
    rawYaml,
    validationIssues: issues
  };
}
