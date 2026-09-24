import { DisplayConfig, ValidationIssue } from '../types/project.js';

export function detectDisplay(yamlObj: any): { display: DisplayConfig; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let rawDisplay = yamlObj?.display;

  if (Array.isArray(rawDisplay)) {
    rawDisplay = rawDisplay[0] || {};
  } else if (!rawDisplay || typeof rawDisplay !== 'object') {
    rawDisplay = {};
    issues.push({
      type: 'WARNING',
      message: 'No display configuration found in YAML. Using default 172x320 canvas.'
    });
  }

  const id = rawDisplay.id || rawDisplay.display_id || 'main_display';
  const platform = rawDisplay.platform || rawDisplay.driver;
  const model = rawDisplay.model;
  const driver = platform || model || 'Unknown';

  let width = typeof rawDisplay.width === 'number' ? rawDisplay.width : undefined;
  let height = typeof rawDisplay.height === 'number' ? rawDisplay.height : undefined;

  if (rawDisplay.dimensions && typeof rawDisplay.dimensions === 'object') {
    if (!width && typeof rawDisplay.dimensions.width === 'number') {
      width = rawDisplay.dimensions.width;
    }
    if (!height && typeof rawDisplay.dimensions.height === 'number') {
      height = rawDisplay.dimensions.height;
    }
  }

  const rotation = typeof rawDisplay.rotation === 'number' ? rawDisplay.rotation : 0;

  if (!width || !height) {
    issues.push({
      type: 'WARNING',
      message: `Display dimensions missing or incomplete (width: ${width || 'Unknown'}, height: ${height || 'Unknown'}). Defaulting to 172x320.`
    });
  }

  let busType: DisplayConfig['busType'] = 'Unknown';
  if (rawDisplay.spi_id || rawDisplay.cs_pin || rawDisplay.dc_pin || platform === 'mipi_spi' || platform === 'st7789v') {
    busType = 'SPI';
  } else if (rawDisplay.i2c_id || rawDisplay.sda_pin) {
    busType = 'I2C';
  } else if (rawDisplay.bus) {
    busType = rawDisplay.bus;
  }

  const display: DisplayConfig = {
    id,
    platform,
    model,
    driver,
    width: width || 172,
    height: height || 320,
    rotation,
    busType,
    colorDepth: rawDisplay.color_depth || (rawDisplay.pixel_mode ? 16 : undefined),
    backlightPin: rawDisplay.backlight_pin || rawDisplay.bk_light_pin,
    spiCsPin: rawDisplay.cs_pin,
    spiDcPin: rawDisplay.dc_pin,
    spiRstPin: rawDisplay.reset_pin || rawDisplay.rst_pin,
    i2cSdaPin: rawDisplay.sda_pin,
    i2cSclPin: rawDisplay.scl_pin
  };

  issues.push({
    type: 'INFO',
    message: `Detected Display: ${display.width}x${display.height} (${display.driver}, Rotation: ${display.rotation}°)`
  });

  return { display, issues };
}
