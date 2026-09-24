import React, { useState } from 'react';
import { DisplayConfig, LvglWidget } from '@esp32-designer/shared';
import { WidgetRenderer } from './WidgetRenderer.tsx';
import { ZoomIn, ZoomOut, RotateCw, Grid, Maximize, Play, Pause, Layers } from 'lucide-react';

interface DisplaySimulatorProps {
  display: DisplayConfig;
  widgets: LvglWidget[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string) => void;
  onUpdateWidget?: (updatedWidget: LvglWidget) => void;
}

export const DisplaySimulator: React.FC<DisplaySimulatorProps> = ({
  display,
  widgets,
  selectedWidgetId,
  onSelectWidget,
  onUpdateWidget
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [rotationOverride, setRotationOverride] = useState<number>(display.rotation || 0);
  const [activeTileIndex, setActiveTileIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const effectiveRotation = rotationOverride % 360;
  const isRotated = effectiveRotation === 90 || effectiveRotation === 270;

  const canvasWidth = isRotated ? display.height : display.width;
  const canvasHeight = isRotated ? display.width : display.height;

  const tileviewWidget = widgets.find((w) => w.type === 'tileview');
  const availableTiles = tileviewWidget?.children || [];

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25));
  const handleRotate = () => setRotationOverride((r) => (r + 90) % 360);

  // If tileview exists with multiple tiles, filter widgets to render
  const renderedWidgets = availableTiles.length > 0
    ? [availableTiles[activeTileIndex % availableTiles.length]]
    : widgets;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Simulator Toolbar */}
      <div className="h-10 bg-darkSidebar border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">
            {display.driver} ({display.width}x{display.height} px)
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
            Rot: {effectiveRotation}°
          </span>
        </div>

        {/* Phase 2: Multi-tile Navigation Controls */}
        {availableTiles.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            <Layers className="w-3.5 h-3.5 text-accentBlue" />
            <span className="text-[10px] text-slate-400">Tile:</span>
            {availableTiles.map((tile, idx) => (
              <button
                key={tile.id}
                onClick={() => setActiveTileIndex(idx)}
                className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                  idx === activeTileIndex ? 'bg-accentBlue text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tile.id}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Phase 2: Animation Timeline Preview Toggle */}
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            title="Toggle Simulator Animation Preview"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
              isAnimating ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            Anim
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
            className={`p-1.5 rounded hover:bg-slate-800 ${showGrid ? 'text-accentBlue bg-slate-800' : 'text-slate-400'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            title="Rotate Screen"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button onClick={handleZoomOut} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] w-12 text-center">{zoom}%</span>
          <button onClick={handleZoomIn} className="p-1 rounded hover:bg-slate-800 text-slate-400">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            title="Reset Zoom"
            className="p-1 rounded hover:bg-slate-800 text-slate-400"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Display Canvas Viewport */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-8 select-none"
        onClick={() => onSelectWidget('')}
      >
        <div
          className="transition-transform duration-200 ease-out shadow-2xl relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Bezel / Hardware Casing Frame */}
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 shadow-2xl">
            {/* Display Panel */}
            <div
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`
              }}
              className={`bg-slate-900 border border-slate-800 rounded relative overflow-hidden ${
                showGrid ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:10px_10px]' : ''
              } ${isAnimating ? 'animate-pulse' : ''}`}
            >
              {renderedWidgets.map((widget) => (
                <WidgetRenderer
                  key={widget.id}
                  widget={widget}
                  isSelected={widget.id === selectedWidgetId}
                  onSelect={onSelectWidget}
                  onUpdateWidget={onUpdateWidget}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
