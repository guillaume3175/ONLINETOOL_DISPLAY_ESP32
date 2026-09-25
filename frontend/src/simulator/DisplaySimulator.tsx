import React, { useState, useRef, useCallback } from 'react';
import { DisplayConfig, LvglWidget, TouchConfig, calculateDisplayTouchCoordinates } from '@esp32-designer/shared';
import { WidgetRenderer } from './WidgetRenderer.tsx';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid,
  Maximize,
  Play,
  Pause,
  Layers,
  Hand,
  Activity
} from 'lucide-react';

interface DisplaySimulatorProps {
  display: DisplayConfig;
  widgets: LvglWidget[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string) => void;
  onUpdateWidget?: (updatedWidget: LvglWidget) => void;
  touchscreen?: TouchConfig;
}

export interface TouchState {
  isDown: boolean;
  isHovering: boolean;
  touchX: number;
  touchY: number;
  canvasX: number;
  canvasY: number;
  startX: number;
  startY: number;
  dragOffsetX: number;
  dragOffsetY: number;
  eventPhase: 'IDLE' | 'DOWN' | 'MOVE' | 'UP';
}

export const DisplaySimulator: React.FC<DisplaySimulatorProps> = ({
  display,
  widgets,
  selectedWidgetId,
  onSelectWidget,
  onUpdateWidget,
  touchscreen
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [rotationOverride, setRotationOverride] = useState<number>(display.rotation || 0);
  const [activeTileIndex, setActiveTileIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [fingerMode, setFingerMode] = useState<boolean>(true);

  // Finger touch tracking state
  const [touchState, setTouchState] = useState<TouchState>({
    isDown: false,
    isHovering: false,
    touchX: 0,
    touchY: 0,
    canvasX: 0,
    canvasY: 0,
    startX: 0,
    startY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    eventPhase: 'IDLE'
  });

  const [lastTouchLog, setLastTouchLog] = useState<string>('Touch Controller Initialized');

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const effectiveRotation = rotationOverride % 360;
  const isRotated = effectiveRotation === 90 || effectiveRotation === 270;

  const canvasWidth = isRotated ? display.height : display.width;
  const canvasHeight = isRotated ? display.width : display.height;

  const tileviewWidget = widgets.find((w) => w.type === 'tileview');
  const availableTiles = tileviewWidget?.children || [];

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25));
  const handleRotate = () => setRotationOverride((r) => (r + 90) % 360);

  // Calculate unrotated display (X,Y) coordinates from canvas relative mouse event
  const calculateTouchCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) {
        return { touchX: 0, touchY: 0, canvasX: 0, canvasY: 0 };
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom / 100;

      // Position in rotated canvas pixels
      let cX = (clientX - rect.left) / scale;
      let cY = (clientY - rect.top) / scale;

      // Clamp to bounds
      cX = Math.max(0, Math.min(canvasWidth, cX));
      cY = Math.max(0, Math.min(canvasHeight, cY));

      const { touchX, touchY } = calculateDisplayTouchCoordinates(
        cX,
        cY,
        display.width,
        display.height,
        effectiveRotation
      );

      return {
        touchX,
        touchY,
        canvasX: Math.round(cX),
        canvasY: Math.round(cY)
      };
    },
    [canvasWidth, canvasHeight, effectiveRotation, display.width, display.height, zoom]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    const coords = calculateTouchCoordinates(e.clientX, e.clientY);
    setTouchState({
      isDown: true,
      isHovering: true,
      touchX: coords.touchX,
      touchY: coords.touchY,
      canvasX: coords.canvasX,
      canvasY: coords.canvasY,
      startX: coords.canvasX,
      startY: coords.canvasY,
      dragOffsetX: 0,
      dragOffsetY: 0,
      eventPhase: 'DOWN'
    });

    const driverName = touchscreen?.driver || touchscreen?.platform || 'Touch';
    setLastTouchLog(`[${driverName}] TOUCH_DOWN @ (${coords.touchX}, ${coords.touchY})`);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const coords = calculateTouchCoordinates(e.clientX, e.clientY);

    setTouchState((prev) => {
      if (!prev.isDown) {
        return {
          ...prev,
          isHovering: true,
          touchX: coords.touchX,
          touchY: coords.touchY,
          canvasX: coords.canvasX,
          canvasY: coords.canvasY
        };
      }

      const dragX = coords.canvasX - prev.startX;
      const dragY = coords.canvasY - prev.startY;

      return {
        ...prev,
        touchX: coords.touchX,
        touchY: coords.touchY,
        canvasX: coords.canvasX,
        canvasY: coords.canvasY,
        dragOffsetX: dragX,
        dragOffsetY: dragY,
        eventPhase: 'MOVE'
      };
    });
  };

  const handlePointerUp = () => {
    setTouchState((prev) => {
      if (!prev.isDown) return prev;

      const driverName = touchscreen?.driver || touchscreen?.platform || 'Touch';
      let nextTileIdx = activeTileIndex;

      // Handle swipe gesture for tileview if present
      if (availableTiles.length > 1) {
        const threshold = 30; // px drag required to trigger swipe
        if (prev.dragOffsetX < -threshold && activeTileIndex < availableTiles.length - 1) {
          nextTileIdx = activeTileIndex + 1;
          setLastTouchLog(`[${driverName}] SWIPE LEFT -> Tile: ${availableTiles[nextTileIdx]?.id}`);
        } else if (prev.dragOffsetX > threshold && activeTileIndex > 0) {
          nextTileIdx = activeTileIndex - 1;
          setLastTouchLog(`[${driverName}] SWIPE RIGHT -> Tile: ${availableTiles[nextTileIdx]?.id}`);
        } else {
          setLastTouchLog(`[${driverName}] TOUCH_UP @ (${prev.touchX}, ${prev.touchY})`);
        }
      } else {
        setLastTouchLog(`[${driverName}] TOUCH_UP @ (${prev.touchX}, ${prev.touchY})`);
      }

      if (nextTileIdx !== activeTileIndex) {
        setActiveTileIndex(nextTileIdx);
      }

      return {
        ...prev,
        isDown: false,
        dragOffsetX: 0,
        dragOffsetY: 0,
        eventPhase: 'UP'
      };
    });
  };

  const handlePointerLeave = () => {
    setTouchState((prev) => ({
      ...prev,
      isDown: false,
      isHovering: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      eventPhase: 'IDLE'
    }));
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative select-none">
      {/* Simulator Toolbar */}
      <div className="h-10 bg-darkSidebar border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-accentBlue" />
            {display.driver} ({display.width}x{display.height} px)
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-400">
            Rot: {effectiveRotation}°
          </span>

          {/* Finger / Touch Simulation Status Indicator */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                touchState.isDown
                  ? 'bg-emerald-400 animate-ping'
                  : touchState.isHovering
                  ? 'bg-amber-400'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-mono text-[10px] text-slate-300">
              {touchState.isDown
                ? `TOUCH (${touchState.touchX}, ${touchState.touchY})`
                : touchState.isHovering
                ? `HOVER (${touchState.touchX}, ${touchState.touchY})`
                : 'FINGER IDLE'}
            </span>
          </div>
        </div>

        {/* Phase 2: Multi-tile Navigation Controls */}
        {availableTiles.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            <Layers className="w-3.5 h-3.5 text-accentBlue" />
            <span className="text-[10px] text-slate-400">Swipe Tile:</span>
            {availableTiles.map((tile, idx) => (
              <button
                key={tile.id}
                onClick={() => setActiveTileIndex(idx)}
                className={`px-1.5 py-0.5 text-[10px] rounded font-medium transition ${
                  idx === activeTileIndex
                    ? 'bg-accentBlue text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tile.id}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Touch Mode Toggle */}
          <button
            onClick={() => setFingerMode(!fingerMode)}
            title="Toggle Finger Touch Simulation Cursor"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition ${
              fingerMode
                ? 'bg-accentBlue/20 text-accentBlue border border-accentBlue/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Hand className="w-3 h-3" />
            Finger Mode
          </button>

          {/* Animation Toggle */}
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            title="Toggle Simulator Animation Preview"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition ${
              isAnimating
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            Anim
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
            className={`p-1.5 rounded hover:bg-slate-800 ${
              showGrid ? 'text-accentBlue bg-slate-800' : 'text-slate-400'
            }`}
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

      {/* Touch Controller Status Banner */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>{lastTouchLog}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Touch Driver: <strong className="text-slate-200">{touchscreen?.driver || touchscreen?.platform || 'Standard Touch'}</strong>
          </span>
          <span>
            Touch Pos: <strong className="text-accentBlue">X:{touchState.touchX} Y:{touchState.touchY}</strong>
          </span>
        </div>
      </div>

      {/* Display Canvas Viewport */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-8 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelectWidget('');
        }}
      >
        <div
          className="transition-transform duration-200 ease-out shadow-2xl relative"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Bezel / Hardware Casing Frame */}
          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700 shadow-2xl relative">
            {/* Display Panel Container */}
            <div
              ref={canvasRef}
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                cursor: fingerMode ? (touchState.isDown ? 'grabbing' : 'pointer') : 'default'
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              className={`bg-slate-900 border border-slate-800 rounded relative overflow-hidden select-none touch-none ${
                showGrid
                  ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:10px_10px]'
                  : ''
              } ${isAnimating ? 'animate-pulse' : ''}`}
            >
              {/* Tileview flex swipe container if tiles are present */}
              {availableTiles.length > 0 ? (
                <div
                  className="w-full h-full flex flex-nowrap"
                  style={{
                    width: `${availableTiles.length * 100}%`,
                    height: '100%',
                    transform: `translateX(calc(${-activeTileIndex * (100 / availableTiles.length)}% + ${touchState.dragOffsetX}px))`,
                    transition: touchState.isDown ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {availableTiles.map((tile) => (
                    <div
                      key={tile.id}
                      style={{ width: `${100 / availableTiles.length}%`, height: '100%' }}
                      className="relative overflow-hidden shrink-0"
                    >
                      {tile.children?.map((child) => (
                        <WidgetRenderer
                          key={child.id}
                          widget={child}
                          isSelected={child.id === selectedWidgetId}
                          onSelect={onSelectWidget}
                          onUpdateWidget={onUpdateWidget}
                          touchState={touchState}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                widgets.map((widget) => (
                  <WidgetRenderer
                    key={widget.id}
                    widget={widget}
                    isSelected={widget.id === selectedWidgetId}
                    onSelect={onSelectWidget}
                    onUpdateWidget={onUpdateWidget}
                    touchState={touchState}
                  />
                ))
              )}

              {/* Finger Touch Simulator Overlay & Feedback Ring */}
              {fingerMode && touchState.isHovering && (
                <div
                  className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out"
                  style={{
                    left: `${touchState.canvasX}px`,
                    top: `${touchState.canvasY}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Outer press ripple when mouse button is down */}
                  {touchState.isDown && (
                    <div className="w-10 h-10 -ml-5 -mt-5 bg-accentBlue/30 border-2 border-accentBlue rounded-full animate-ping absolute" />
                  )}

                  {/* Finger touch circle */}
                  <div
                    className={`rounded-full border flex items-center justify-center transition-all ${
                      touchState.isDown
                        ? 'w-8 h-8 bg-accentBlue/40 border-accentBlue shadow-lg scale-90'
                        : 'w-6 h-6 bg-white/20 border-white/60 shadow'
                    }`}
                  >
                    <div
                      className={`rounded-full ${
                        touchState.isDown ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-accentBlue'
                      }`}
                    />
                  </div>

                  {/* Real-time screen touch coordinate tooltip badge */}
                  <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-slate-900/90 text-slate-100 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap shadow-md">
                    X:{touchState.touchX} Y:{touchState.touchY}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
