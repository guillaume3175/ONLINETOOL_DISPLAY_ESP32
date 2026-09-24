import React, { useState } from 'react';
import { Esp32Project, parseYamlToProject, generateYamlFromProject, LvglWidget } from '@esp32-designer/shared';
import { DisplaySimulator } from './simulator/DisplaySimulator.tsx';
import { PropertiesPanel } from './properties/PropertiesPanel.tsx';
import { YamlEditor } from './editor/YamlEditor.tsx';
import { NodeEditor } from './node-editor/NodeEditor.tsx';
import { Code, Eye, Network, AlertCircle, CheckCircle, Upload, Plus } from 'lucide-react';

const DEFAULT_YAML = `
esphome:
  name: waveshare-s3-147b
  friendly_name: Waveshare 1.47B Horloge Météo

esp32:
  board: esp32-s3-devkitc-1
  framework:
    type: esp-idf

display:
  - platform: mipi_spi
    id: lcd
    model: CUSTOM
    dc_pin: GPIO45
    cs_pin: GPIO21
    reset_pin: GPIO40
    dimensions:
      width: 172
      height: 320

i2c:
  sda: GPIO42
  scl: GPIO41

touchscreen:
  - platform: axs5106
    id: mini_touch
    display: lcd

lvgl:
  displays:
    - lcd
  touchscreens:
    - touchscreen_id: mini_touch
  page_wrap: false

  widgets:
    - tileview:
        id: iphone_swipe
        x: 0
        y: 0
        width: 172
        height: 320
        scrollbar_mode: "OFF"

        tiles:
          - id: canvas_1
            row: 0
            column: 0
            dir: HOR
            bg_color: 0xF2F2F7
            widgets:
              - obj:
                  x: 10
                  y: 8
                  width: 152
                  height: 30
                  bg_color: 0xFFFFFF
                  radius: 15
                  border_width: 0
                  widgets:
                    - label:
                        x: 0
                        y: 0
                        align: center
                        text: "METEO"
                        text_color: 0x8E8E93

              - obj:
                  x: 10
                  y: 50
                  width: 152
                  height: 108
                  bg_color: 0xFFFFFF
                  radius: 24
                  border_width: 0
                  widgets:
                    - label:
                        id: lv_time
                        x: 0
                        y: 10
                        width: 152
                        text: "12:42"
                        text_color: 0x1C1C1E

                    - label:
                        id: lv_day
                        x: 0
                        y: 70
                        width: 152
                        text: "Lundi"
                        text_color: 0x8E8E93

                    - label:
                        id: lv_date
                        x: 0
                        y: 86
                        width: 152
                        text: "22/09/2026"
                        text_color: 0x1C1C1E

              - obj:
                  x: 10
                  y: 163
                  width: 152
                  height: 78
                  bg_color: 0xFFFFFF
                  radius: 22
                  border_width: 0
                  widgets:
                    - label:
                        x: 0
                        y: 10
                        text: "TEMPERATURE"
                        text_color: 0x8E8E93

                    - label:
                        id: lv_temperature
                        x: 10
                        y: 29
                        width: 92
                        text: "22.5°"
                        text_color: 0x1C1C1E

              - obj:
                  x: 10
                  y: 251
                  width: 152
                  height: 48
                  bg_color: 0xFFFFFF
                  radius: 20
                  border_width: 0
                  widgets:
                    - label:
                        x: 14
                        y: 7
                        text: "Wi-Fi"
                        text_color: 0x1C1C1E

                    - label:
                        id: lv_wifi_quality
                        x: 91
                        y: 7
                        width: 47
                        text: "98%"
                        text_color: 0x34C759
`;

export default function App() {
  const [yaml, setYaml] = useState<string>(DEFAULT_YAML.trim());
  const [project, setProject] = useState<Esp32Project>(() => parseYamlToProject(DEFAULT_YAML.trim()));
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'nodeEditor' | 'code'>('simulator');

  const handleYamlChange = (newYaml: string) => {
    setYaml(newYaml);
    try {
      const parsed = parseYamlToProject(newYaml);
      setProject(parsed);
    } catch (e) {
      console.error('Parsing error', e);
    }
  };

  const handleUpdateWidget = (updatedWidget: LvglWidget) => {
    const updatedWidgets = project.lvgl.widgets.map((w) =>
      w.id === updatedWidget.id ? updatedWidget : w
    );
    const updatedProject: Esp32Project = {
      ...project,
      lvgl: {
        ...project.lvgl,
        widgets: updatedWidgets
      }
    };
    const newYaml = generateYamlFromProject(updatedProject);
    setProject(updatedProject);
    setYaml(newYaml);
  };

  const handleUpdateDisplay = (width: number, height: number, rotation: number) => {
    const updatedProject: Esp32Project = {
      ...project,
      display: {
        ...project.display,
        width,
        height,
        rotation
      }
    };
    const newYaml = generateYamlFromProject(updatedProject);
    setProject(updatedProject);
    setYaml(newYaml);
  };

  const handleAddWidget = (type: LvglWidget['type']) => {
    const newWidget: LvglWidget = {
      id: `${type}_${Date.now().toString().slice(-4)}`,
      type,
      x: 20,
      y: 20 + project.lvgl.widgets.length * 30,
      text: type === 'label' ? 'New Label' : type === 'button' ? 'Click' : undefined,
      properties: {}
    };
    const updatedProject: Esp32Project = {
      ...project,
      lvgl: {
        ...project.lvgl,
        widgets: [...project.lvgl.widgets, newWidget]
      }
    };
    const newYaml = generateYamlFromProject(updatedProject);
    setProject(updatedProject);
    setYaml(newYaml);
    setSelectedWidgetId(newWidget.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) handleYamlChange(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-darkBg text-slate-100 overflow-hidden">
      <header className="h-12 bg-darkSidebar border-b border-slate-800 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-accentBlue rounded-full" />
            ESP32 Display & LVGL Designer
          </div>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
            {project.name}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium ${
              activeTab === 'simulator' ? 'bg-accentBlue text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('nodeEditor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium ${
              activeTab === 'nodeEditor' ? 'bg-accentBlue text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Node Visualizer
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium ${
              activeTab === 'code' ? 'bg-accentBlue text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            YAML Code
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded cursor-pointer border border-slate-700 transition">
            <Upload className="w-3.5 h-3.5" />
            Import YAML
            <input type="file" accept=".yaml,.yml" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 bg-darkSidebar border-r border-slate-800 flex flex-col p-3 space-y-4">
          <div className="text-xs font-bold text-slate-400 tracking-wider uppercase">Add Widgets</div>
          <div className="grid grid-cols-1 gap-1.5">
            {(['label', 'button', 'slider', 'switch', 'checkbox', 'bar', 'dropdown', 'container'] as const).map((wType) => (
              <button
                key={wType}
                onClick={() => handleAddWidget(wType)}
                className="flex items-center justify-between text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1.5 rounded transition"
              >
                <span>{wType}</span>
                <Plus className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3">
            <div className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">Detected Hardware</div>
            <div className="text-[11px] space-y-1 text-slate-400">
              <div><span className="text-slate-500">MCU:</span> {project.board.mcu}</div>
              <div><span className="text-slate-500">Display:</span> {project.display.driver}</div>
              <div><span className="text-slate-500">Res:</span> {project.display.width}x{project.display.height}</div>
              <div><span className="text-slate-500">Touch:</span> {project.touchscreen?.driver || 'None'}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'simulator' && (
            <DisplaySimulator
              display={project.display}
              widgets={project.lvgl.widgets}
              selectedWidgetId={selectedWidgetId}
              onSelectWidget={setSelectedWidgetId}
              onUpdateWidget={handleUpdateWidget}
            />
          )}

          {activeTab === 'nodeEditor' && (
            <NodeEditor project={project} onSelectWidget={setSelectedWidgetId} />
          )}

          {activeTab === 'code' && (
            <YamlEditor value={yaml} onChange={handleYamlChange} />
          )}

          <div className="h-28 bg-darkSidebar border-t border-slate-800 p-2 text-xs flex flex-col">
            <div className="font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>Validation & System Logs</span>
              <span className="text-[10px] text-slate-500">{project.validationIssues.length} message(s)</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px]">
              {project.validationIssues.map((issue, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {issue.type === 'ERROR' && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  {issue.type === 'WARNING' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {issue.type === 'INFO' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span className={issue.type === 'ERROR' ? 'text-red-300' : issue.type === 'WARNING' ? 'text-amber-300' : 'text-slate-300'}>
                    [{issue.type}] {issue.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PropertiesPanel
          project={project}
          selectedWidgetId={selectedWidgetId}
          onUpdateWidget={handleUpdateWidget}
          onUpdateDisplay={handleUpdateDisplay}
        />
      </div>
    </div>
  );
}
