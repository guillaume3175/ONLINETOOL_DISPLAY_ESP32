import React, { useEffect, useRef } from 'react';
import { LvglWidget } from '@esp32-designer/shared';
import { TouchState } from './DisplaySimulator.tsx';

interface WidgetRendererProps {
  widget: LvglWidget;
  isSelected: boolean;
  onSelect: (widgetId: string) => void;
  onUpdateWidget?: (updatedWidget: LvglWidget) => void;
  touchState?: TouchState;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onUpdateWidget,
  touchState
}) => {
  const isCentered = widget.style?.align === 'center' || widget.properties?.align === 'center';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(widget.id);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: isCentered ? '50%' : `${widget.x}px`,
    top: isCentered ? '50%' : `${widget.y}px`,
    transform: isCentered ? 'translate(-50%, -50%)' : undefined,
    width: widget.width ? `${widget.width}px` : undefined,
    height: widget.height ? `${widget.height}px` : undefined,
    backgroundColor: widget.style?.bg_color,
    color: widget.style?.text_color,
    borderRadius: widget.style?.radius !== undefined ? `${widget.style.radius}px` : undefined,
    borderWidth: widget.style?.border_width !== undefined ? `${widget.style.border_width}px` : undefined,
    borderColor: widget.style?.border_color || 'transparent',
    boxSizing: 'border-box'
  };

  const borderClass = isSelected
    ? 'ring-2 ring-accentBlue ring-offset-1 ring-offset-black z-20'
    : 'hover:ring-1 hover:ring-slate-400';

  // Check if touch point (X, Y) is currently within widget bounds
  const isTouchInside = (() => {
    if (!touchState) return false;
    const wx = widget.x;
    const wy = widget.y;
    const ww = widget.width || 100;
    const wh = widget.height || 30;
    return (
      touchState.touchX >= wx &&
      touchState.touchX <= wx + ww &&
      touchState.touchY >= wy &&
      touchState.touchY <= wy + wh
    );
  })();

  const isPressed = touchState?.isDown && isTouchInside;

  // Handle live finger dragging for slider
  const lastSliderValueRef = useRef<number | null>(null);
  useEffect(() => {
    if (widget.type === 'slider' && touchState?.isDown && isTouchInside && onUpdateWidget) {
      const minVal = widget.minValue ?? 0;
      const maxVal = widget.maxValue ?? 100;
      const sliderWidth = widget.width || 120;
      const localX = touchState.touchX - widget.x;
      const ratio = Math.max(0, Math.min(1, localX / sliderWidth));
      const calculatedVal = Math.round(minVal + ratio * (maxVal - minVal));

      if (lastSliderValueRef.current !== calculatedVal) {
        lastSliderValueRef.current = calculatedVal;
        onUpdateWidget({ ...widget, value: calculatedVal });
      }
    }
  }, [widget, touchState, isTouchInside, onUpdateWidget]);

  switch (widget.type) {
    case 'label':
      return (
        <div
          onClick={handleClick}
          style={style}
          className={`cursor-pointer px-1 py-0.5 text-xs rounded select-none transition-all ${borderClass}`}
        >
          {widget.text || 'Label'}
        </div>
      );

    case 'button':
      return (
        <button
          onClick={(e) => {
            handleClick(e);
            console.log(`[Simulator Event] Button ${widget.id} CLICKED / TOUCHED`);
          }}
          style={style}
          className={`cursor-pointer text-white font-medium text-xs px-3 py-1.5 rounded shadow transition-all duration-75 select-none ${
            isPressed
              ? 'bg-blue-700 scale-95 shadow-inner brightness-110 ring-2 ring-white/50'
              : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
          } ${borderClass}`}
        >
          {widget.text || 'Button'}
        </button>
      );

    case 'slider': {
      const sliderVal = widget.value ?? 50;
      const min = widget.minValue ?? 0;
      const max = widget.maxValue ?? 100;
      const percentage = Math.max(0, Math.min(100, ((sliderVal - min) / (max - min)) * 100));

      return (
        <div
          onClick={handleClick}
          style={{ ...style, width: widget.width ? `${widget.width}px` : '120px' }}
          className={`cursor-pointer flex flex-col gap-1 p-1.5 bg-slate-800/90 rounded select-none transition-all ${
            isPressed ? 'ring-2 ring-accentBlue' : borderClass
          }`}
        >
          <div className="relative w-full h-2 bg-slate-700 rounded-lg overflow-hidden">
            <div
              className="h-full bg-accentBlue transition-all duration-75"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={sliderVal}
            onChange={(e) => {
              if (onUpdateWidget) {
                onUpdateWidget({ ...widget, value: Number(e.target.value) });
              }
            }}
            className="w-full h-1 bg-transparent opacity-0 cursor-pointer absolute inset-0"
          />
        </div>
      );
    }

    case 'switch': {
      const isChecked = widget.checked ?? false;
      return (
        <div
          onClick={(e) => {
            handleClick(e);
            if (onUpdateWidget) {
              onUpdateWidget({ ...widget, checked: !isChecked });
            }
          }}
          style={style}
          className={`cursor-pointer flex items-center gap-2 p-1 rounded select-none transition-transform ${
            isPressed ? 'scale-95' : ''
          } ${borderClass}`}
        >
          <div
            className={`w-9 h-5 flex items-center rounded-full p-1 duration-300 ${
              isChecked ? 'bg-emerald-500 shadow-sm' : 'bg-slate-600'
            }`}
          >
            <div
              className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ${
                isChecked ? 'translate-x-3.5' : ''
              }`}
            />
          </div>
          {widget.text && <span className="text-xs text-slate-200">{widget.text}</span>}
        </div>
      );
    }

    case 'checkbox': {
      const cbChecked = widget.checked ?? false;
      return (
        <div
          onClick={(e) => {
            handleClick(e);
            if (onUpdateWidget) {
              onUpdateWidget({ ...widget, checked: !cbChecked });
            }
          }}
          style={style}
          className={`cursor-pointer flex items-center gap-2 px-1 py-0.5 text-xs rounded select-none transition-transform ${
            isPressed ? 'scale-95' : ''
          } ${borderClass}`}
        >
          <input
            type="checkbox"
            checked={cbChecked}
            readOnly
            className="w-3.5 h-3.5 rounded accent-accentBlue cursor-pointer"
          />
          <span className="text-slate-200">{widget.text || 'Checkbox'}</span>
        </div>
      );
    }

    case 'bar': {
      const barVal = widget.value ?? 60;
      const min = widget.minValue ?? 0;
      const max = widget.maxValue ?? 100;
      const pct = Math.max(0, Math.min(100, ((barVal - min) / (max - min)) * 100));
      return (
        <div
          onClick={handleClick}
          style={{
            ...style,
            width: widget.width ? `${widget.width}px` : '120px',
            height: widget.height ? `${widget.height}px` : '16px'
          }}
          className={`cursor-pointer bg-slate-800 rounded p-0.5 relative overflow-hidden select-none ${borderClass}`}
        >
          <div
            className="h-full bg-accentBlue rounded-sm transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      );
    }

    case 'dropdown': {
      const options = widget.options || ['Option 1', 'Option 2', 'Option 3'];
      const currentIdx = widget.selectedIndex || 0;
      return (
        <div
          onClick={(e) => {
            handleClick(e);
            if (onUpdateWidget && options.length > 0) {
              const nextIdx = (currentIdx + 1) % options.length;
              onUpdateWidget({ ...widget, selectedIndex: nextIdx });
            }
          }}
          style={{ ...style, width: widget.width ? `${widget.width}px` : '120px' }}
          className={`cursor-pointer bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded flex items-center justify-between select-none ${borderClass}`}
        >
          <span>{options[currentIdx] || 'Select...'}</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </div>
      );
    }

    case 'tileview':
    case 'tile':
    case 'tiles':
    case 'container':
    case 'obj':
      return (
        <div
          onClick={handleClick}
          style={{
            ...style,
            width: widget.width ? `${widget.width}px` : '100%',
            height: widget.height ? `${widget.height}px` : '100%'
          }}
          className={`cursor-pointer rounded relative overflow-hidden transition-all ${borderClass}`}
        >
          {widget.text && <div className="text-[10px] opacity-70 font-bold p-1">{widget.text}</div>}
          {widget.children?.map((child) => (
            <WidgetRenderer
              key={child.id}
              widget={child}
              isSelected={isSelected}
              onSelect={onSelect}
              onUpdateWidget={onUpdateWidget}
              touchState={touchState}
            />
          ))}
        </div>
      );

    default:
      return (
        <div
          onClick={handleClick}
          style={style}
          className={`cursor-pointer border border-dashed border-amber-500 bg-amber-950/40 p-1.5 rounded text-[10px] text-amber-300 font-mono select-none ${borderClass}`}
        >
          [{widget.type}] {widget.id}
        </div>
      );
  }
};
