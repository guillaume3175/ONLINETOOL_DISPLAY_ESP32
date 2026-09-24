import { TouchConfig, ValidationIssue } from '../types/project.js';

export function detectTouchscreen(yamlObj: any): { touchscreen?: TouchConfig; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let rawTouch = yamlObj?.touchscreen || yamlObj?.touch;

  if (Array.isArray(rawTouch)) {
    rawTouch = rawTouch[0];
  }

  // Fallback to checking lvgl.touchscreens references if rawTouch is missing or ID lookup is needed
  if (!rawTouch || typeof rawTouch !== 'object') {
    const lvglTouchscreens = yamlObj?.lvgl?.touchscreens;
    if (Array.isArray(lvglTouchscreens) && lvglTouchscreens.length > 0) {
      const firstLvglTouch = lvglTouchscreens[0];
      const touchId = typeof firstLvglTouch === 'string' ? firstLvglTouch : firstLvglTouch?.touchscreen_id;
      if (touchId) {
        issues.push({
          type: 'INFO',
          message: `Detected Touch Controller reference in LVGL: ${touchId}`
        });
        return {
          touchscreen: {
            id: touchId,
            driver: 'Linked Touch Controller',
            busType: 'I2C'
          },
          issues
        };
      }
    }

    issues.push({
      type: 'INFO',
      message: 'No touch controller configuration found.'
    });
    return { issues };
  }

  const id = rawTouch.id || 'main_touch';
  const platform = rawTouch.platform || rawTouch.driver;
  const model = rawTouch.model;
  const driver = platform || model || 'Unknown';

  let busType: TouchConfig['busType'] = 'Unknown';
  if (yamlObj?.i2c || rawTouch.i2c_id || rawTouch.sda_pin) {
    busType = 'I2C';
  } else if (rawTouch.spi_id || rawTouch.cs_pin) {
    busType = 'SPI';
  }

  const touchscreen: TouchConfig = {
    id,
    platform,
    model,
    driver,
    busType,
    i2cSdaPin: rawTouch.sda_pin,
    i2cSclPin: rawTouch.scl_pin,
    interruptPin: rawTouch.interrupt_pin || rawTouch.irq_pin,
    resetPin: rawTouch.reset_pin || rawTouch.rst_pin
  };

  issues.push({
    type: 'INFO',
    message: `Detected Touch Controller: ${touchscreen.driver} (${busType} bus)`
  });

  return { touchscreen, issues };
}
