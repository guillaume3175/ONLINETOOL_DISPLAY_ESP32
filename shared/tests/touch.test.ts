import { describe, it, expect } from 'vitest';
import { calculateDisplayTouchCoordinates } from '../src/simulator/touchCoordinates.js';

describe('Touch Coordinates Rotation Mapping', () => {
  const displayWidth = 172;
  const displayHeight = 320;

  it('maps coordinates accurately at 0 degrees rotation', () => {
    const coords = calculateDisplayTouchCoordinates(10, 20, displayWidth, displayHeight, 0);
    expect(coords).toEqual({ touchX: 10, touchY: 20 });
  });

  it('maps coordinates accurately at 90 degrees rotation', () => {
    const coords = calculateDisplayTouchCoordinates(0, 0, displayWidth, displayHeight, 90);
    expect(coords).toEqual({ touchX: 0, touchY: 320 });
  });

  it('maps coordinates accurately at 180 degrees rotation', () => {
    const coords = calculateDisplayTouchCoordinates(10, 20, displayWidth, displayHeight, 180);
    expect(coords).toEqual({ touchX: 162, touchY: 300 });
  });

  it('maps coordinates accurately at 270 degrees rotation', () => {
    const coords = calculateDisplayTouchCoordinates(0, 0, displayWidth, displayHeight, 270);
    expect(coords).toEqual({ touchX: 172, touchY: 0 });
  });
});
