import React from 'react';
import { LvglWidget } from '@esp32-designer/shared';

interface WidgetRendererProps {
  widget: LvglWidget;
  isSelected: boolean;
  onSelect: (widgetId: string) => void;
  onUpdateWidget?: (updatedWidget: LvglWidget) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isSelected,
  onSelect,
  onUpdateWidget
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(widget.id);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${widget.x}px`,
    top: `${widget.y}px`,
    width: widget.width ? `${widget.width}px` : undefined,
    height: widget.height ? `${widget.height}px` : undefined,
    backgroundColor: widget.style?.bg_color,
    color: widget.style?.text_color,
    borderRadius: widget.style?.radius !== undefined ? `${widget.style.radius}px` : undefined,
    borderWidth: widget.style?.border_width !== undefined ? `${widget.style.border_width}px` : undefined,
    borderColor: widget.style?.border_color || 'transparent',
    boxSizing: 'border-box'
  };

  if (widget.style?.align === 'center') {
    style.left = '50%';
    style.top = '50%';
    style.transform = 'translate(-50%, -50%)';
  }

  const borderClass = isSelected
    ? 'ring-2 ring-accentBlue ring-offset-1 ring-offset-black z-20'
    : 'hover:ring-1 hover:ring-slate-400';

  switch (widget.type) {
    case 'label':
      return (
        <div
          onClick={handleClick}
          style={style}
          className={`cursor-pointer px-1 py-0.5 text-xs rounded select-none ${borderClass}`}
        >
          {widget.text || 'Label'}
        </div>
      );

    case 'button':
      return (
        <button
          onClick={(e) => {
            handleClick(e);
            console.log(`[Simulator Event] Button ${widget.id} CLICKED`);
          }}
          style={style}
          className={`cursor-pointer bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs px-3 py-1.5 rounded shadow ${borderClass}`}
        >
          {widget.text || 'Button'}
        </button>
      );

    case 'slider':
      const sliderVal = widget.value ?? 50;
      return (
        <div
          onClick={handleClick}
          style={{ ...style, width: widget.width ? `${widget.width}px` : '120px' }}
          className={`cursor-pointer flex flex-col gap-1 p-1 bg-slate-800/80 rounded ${borderClass}`}
        >
          <input
            type="range"
            min={widget.minValue ?? 0}
            max={widget.maxValue ?? 100}
            value={sliderVal}
            onChange={(e) => {
              if (onUpdateWidget) {
                onUpdateWidget({ ...widget, value: Number(e.target.value) });
              }
            }}
            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-accentBlue"
          />
        </div>
      );

    case 'switch':
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
          className={`cursor-pointer flex items-center gap-2 p-1 rounded select-none ${borderClass}`}
        >
          <div
            className={`w-9 h-5 flex items-center rounded-full p-1 duration-300 ${
              isChecked ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <div
              className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ${
                isChecked ? 'translate-x-3.5' : ''
              }`}
            />
          </div>
          {widget.text && <span className="text-xs">{widget.text}</span>}
        </div>
      );

    case 'checkbox':
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
          className={`cursor-pointer flex items-center gap-2 px-1 py-0.5 text-xs rounded select-none ${borderClass}`}
        >
          <input
            type="checkbox"
            checked={cbChecked}
            readOnly
            className="w-3.5 h-3.5 rounded accent-accentBlue"
          />
          <span>{widget.text || 'Checkbox'}</span>
        </div>
      );

    case 'tileview':
    case 'container':
      return (
        <div
          onClick={handleClick}
          style={{
            ...style,
            width: widget.width ? `${widget.width}px` : '100%',
            height: widget.height ? `${widget.height}px` : '100%'
          }}
          className={`cursor-pointer rounded relative overflow-hidden ${borderClass}`}
        >
          {widget.text && <div className="text-[10px] opacity-70 font-bold p-1">{widget.text}</div>}
          {widget.children?.map((child) => (
            <WidgetRenderer
              key={child.id}
              widget={child}
              isSelected={isSelected}
              onSelect={onSelect}
              onUpdateWidget={onUpdateWidget}
            />
          ))}
        </div>
      );

    default:
      return (
        <div
          onClick={handleClick}
          style={style}
          className={`cursor-pointer border border-dashed border-amber-500 bg-amber-950/40 p-1.5 rounded text-[10px] text-amber-300 font-mono ${borderClass}`}
        >
          [{widget.type}] {widget.id}
        </div>
      );
  }
};
