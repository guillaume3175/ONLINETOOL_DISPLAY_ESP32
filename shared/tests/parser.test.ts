import { describe, it, expect } from 'vitest';
import { parseYamlToProject } from '../src/parser/yamlParser.js';
import { generateYamlFromProject } from '../src/generator/yamlGenerator.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('YAML Parser & Detector', () => {
  it('correctly parses ESPHome display and LVGL widgets', () => {
    const yamlInput = `
esphome:
  name: test-waveshare-s3

esp32:
  board: esp32-s3-devkitc-1

display:
  - platform: st7789v
    id: main_display
    width: 172
    height: 320
    rotation: 90
    cs_pin: GPIO9

lvgl:
  widgets:
    - label:
        id: title_lbl
        text: "Hello World"
        x: 10
        y: 20
    - button:
        id: main_btn
        x: 10
        y: 60
        width: 100
        height: 40
        text: "Click Me"
`;

    const project = parseYamlToProject(yamlInput);
    expect(project.name).toBe('test-waveshare-s3');
    expect(project.display.width).toBe(172);
    expect(project.display.height).toBe(320);
    expect(project.display.rotation).toBe(90);
    expect(project.display.busType).toBe('SPI');
    expect(project.lvgl.widgets.length).toBe(2);
    expect(project.lvgl.widgets[0].type).toBe('label');
    expect(project.lvgl.widgets[0].text).toBe('Hello World');
    expect(project.lvgl.widgets[1].type).toBe('button');
    expect(project.lvgl.widgets[1].width).toBe(100);
  });

  it('correctly parses complex Weather Clock YAML structure with mipi_spi, dimensions, axs5106, tileview and obj', () => {
    const weatherClockYaml = readFileSync(join(__dirname, '../../examples/waveshare-weather-clock.yaml'), 'utf-8');
    const project = parseYamlToProject(weatherClockYaml);

    expect(project.display.width).toBe(172);
    expect(project.display.height).toBe(320);
    expect(project.display.platform).toBe('mipi_spi');
    expect(project.touchscreen?.platform).toBe('axs5106');
    expect(project.lvgl.displays).toContain('lcd');
    expect(project.lvgl.widgets.length).toBe(1);
    expect(project.lvgl.widgets[0].type).toBe('tileview');
    expect(project.lvgl.widgets[0].children?.length).toBe(1);
    expect(project.lvgl.widgets[0].children![0].children![0].type).toBe('container');
  });

  it('correctly parses lvgl.touchscreens objects and page_wrap flag', () => {
    const yamlWithTouchscreens = `
display:
  id: lcd
  width: 172
  height: 320
touchscreen:
  - platform: axs5106
    id: mini_touch
lvgl:
  displays:
    - lcd
  touchscreens:
    - touchscreen_id: mini_touch
  page_wrap: false
  widgets:
    - tileview:
        id: iphone_swipe
        scrollbar_mode: "OFF"
`;

    const project = parseYamlToProject(yamlWithTouchscreens);
    expect(project.lvgl.displays).toContain('lcd');
    expect(project.lvgl.touchscreens).toContain('mini_touch');
    expect(project.lvgl.pageWrap).toBe(false);
    expect(project.lvgl.widgets[0].properties.scrollbar_mode).toBe('OFF');
  });

  it('handles unknown widgets gracefully without throwing', () => {
    const yamlInput = `
display:
  width: 240
  height: 240
lvgl:
  widgets:
    - custom_fancy_widget:
        id: fancy1
        x: 0
        y: 0
`;

    const project = parseYamlToProject(yamlInput);
    expect(project.display.width).toBe(240);
    expect(project.lvgl.widgets.length).toBe(1);
    expect(project.lvgl.widgets[0].type).toBe('unknown');
    expect(project.validationIssues.some(i => i.type === 'WARNING')).toBe(true);
  });

  it('generates valid YAML back from project internal model', () => {
    const yamlInput = `
display:
  width: 172
  height: 320
lvgl:
  widgets:
    - label:
        text: "Test"
`;
    const project = parseYamlToProject(yamlInput);
    const reGeneratedYaml = generateYamlFromProject(project);
    expect(reGeneratedYaml).toContain('width: 172');
    expect(reGeneratedYaml).toContain('text: Test');
  });
});
