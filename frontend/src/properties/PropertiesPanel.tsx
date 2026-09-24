import React from 'react';
import { Esp32Project, LvglWidget } from '@esp32-designer/shared';
import { Sliders, Settings } from 'lucide-react';

interface PropertiesPanelProps {
  project: Esp32Project;
  selectedWidgetId: string | null;
  onUpdateWidget: (updatedWidget: LvglWidget) => void;
  onUpdateDisplay: (width: number, height: number, rotation: number) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  selectedWidgetId,
  onUpdateWidget,
  onUpdateDisplay
}) => {
  const selectedWidget = project.lvgl.widgets.find((w) => w.id === selectedWidgetId);

  return (
    <div className="w-80 bg-darkSidebar border-l border-slate-800 flex flex-col h-full text-xs text-slate-300">
      <div className="h-10 border-b border-slate-800 px-4 flex items-center gap-2 font-semibold text-slate-200">
        <Sliders className="w-4 h-4 text-accentBlue" />
        <span>Properties</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selectedWidget ? (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-bold text-accentBlue">{selectedWidget.type.toUpperCase()}</span>
              <span className="text-[10px] text-slate-500 font-mono">{selectedWidget.id}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Position & Size</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">X Position</span>
                  <input
                    type="number"
                    value={selectedWidget.x}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, x: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Y Position</span>
                  <input
                    type="number"
                    value={selectedWidget.y}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, y: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Width</span>
                  <input
                    type="number"
                    value={selectedWidget.width || ''}
                    placeholder="Auto"
                    onChange={(e) =>
                      onUpdateWidget({
                        ...selectedWidget,
                        width: e.target.value ? Number(e.target.value) : undefined
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Height</span>
                  <input
                    type="number"
                    value={selectedWidget.height || ''}
                    placeholder="Auto"
                    onChange={(e) =>
                      onUpdateWidget({
                        ...selectedWidget,
                        height: e.target.value ? Number(e.target.value) : undefined
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
              </div>
            </div>

            {'text' in selectedWidget && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Text Content</label>
                <input
                  type="text"
                  value={selectedWidget.text || ''}
                  onChange={(e) => onUpdateWidget({ ...selectedWidget, text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
              </div>
            )}

            {'value' in selectedWidget && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Value</label>
                <input
                  type="number"
                  value={selectedWidget.value ?? 0}
                  onChange={(e) => onUpdateWidget({ ...selectedWidget, value: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4 text-accentOrange" />
              <span className="font-semibold text-slate-200">Display Configuration</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-500">Driver</span>
                <input
                  type="text"
                  disabled
                  value={project.display.driver}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded px-2 py-1 text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500">Width (px)</span>
                  <input
                    type="number"
                    value={project.display.width}
                    onChange={(e) =>
                      onUpdateDisplay(
                        Number(e.target.value),
                        project.display.height,
                        project.display.rotation
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">Height (px)</span>
                  <input
                    type="number"
                    value={project.display.height}
                    onChange={(e) =>
                      onUpdateDisplay(
                        project.display.width,
                        Number(e.target.value),
                        project.display.rotation
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500">Rotation</span>
                <select
                  value={project.display.rotation}
                  onChange={(e) =>
                    onUpdateDisplay(
                      project.display.width,
                      project.display.height,
                      Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100"
                >
                  <option value={0}>0°</option>
                  <option value={90}>90°</option>
                  <option value={180}>180°</option>
                  <option value={270}>270°</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
