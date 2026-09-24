# ESP32 Display & LVGL Graphic Designer / Simulator

A web-based IDE and visual simulator for ESP32 display configurations, touch controllers, and LVGL graphics. Import ESPHome YAML files, inspect detected hardware specifications, visually build screens with an extensible widget registry, inspect component relationships via node graphs, and preview interactive UI in real time.

---

## 1. Architecture Overview

The application is structured as a TypeScript monorepo using npm workspaces:

```text
/
├── shared/            # Normalized Internal Model, YAML parser, detectors & generators
├── backend/           # Express REST API for project parsing, validation, and generation
├── frontend/          # React + Vite + Monaco Editor + React Flow + Display Simulator
├── examples/          # Sample ESP32 / ESPHome YAML configurations
├── .devcontainer/     # DevContainer setup with Node.js 22 & VSCode extensions
└── package.json       # Root scripts and workspace declarations
```

### Core Pipeline

```text
YAML File / Monaco Editor
         ↓
  Shared Parser / API
         ↓
 Normalized Project Model
  ├── Board / MCU
  ├── Display Driver & Geometry
  ├── Touch Controller
  └── LVGL Widgets Tree
         ↓
┌─────────────────────────────────────────┐
│              IDE Workspace              │
├───────────────────┬─────────────────────┤
│ Display Simulator │ Visual Node Editor  │
│  (Real Rendering) │    (React Flow)     │
├───────────────────┴─────────────────────┤
│         Properties Sync Panel           │
└─────────────────────────────────────────┘
```

---

## 2. Key Features

- **YAML Parser & Detection**: Parses ESPHome / ESP32 YAML files, extracting screen resolution, driver type, bus interface (SPI/I2C), and rotation.
- **Display Simulator**: Interactive browser rendering with customizable zoom (25% to 200%), grid overlays, touch/click interactions, and screen rotation.
- **LVGL Widget Registry**: Supports `label`, `button`, `slider`, `switch`, `checkbox`, `dropdown`, `bar`, `container`, `arc`, and extensible placeholders for unhandled components.
- **Node Editor Visualizer**: React Flow graph visualization showing connections between ESP32 Board -> Display -> Touch Controller -> LVGL Screen -> Widgets.
- **Monaco YAML Editor & Properties Panel**: Real-time bidirectional parameter editing with live synchronization across all editor panels.
- **Validation Log Panel**: Highlights system status, warnings, and syntax/schema validation messages (`INFO`, `WARNING`, `ERROR`).

---

## 3. Getting Started & Development Commands

### Installation

```bash
npm install
```

### Build All Workspaces

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

### Start Development Server

```bash
npm run dev
```

This concurrently launches:
- **Backend API**: `http://localhost:3000`
- **Frontend App**: `http://localhost:5173`

---

## 4. Supported YAML Schema Example

```yaml
esphome:
  name: waveshare-s3-147b

esp32:
  board: esp32-s3-devkitc-1

display:
  - platform: st7789v
    id: main_display
    width: 172
    height: 320
    rotation: 0

touchscreen:
  - platform: cst816s

lvgl:
  displays:
    - main_display
  widgets:
    - label:
        id: title_label
        text: "ESP32 LVGL"
        x: 20
        y: 20
    - button:
        id: test_button
        text: "START"
        x: 20
        y: 80
        width: 130
        height: 40
```

---

## 5. Technical Roadmap & Future Evolution

1. **Phase 1 (Completed MVP)**: YAML import, hardware parsing, display simulator, widget rendering, node visualizer, properties editing, and REST API.
2. **Phase 2**: Multi-page LVGL navigation support, animation timelines, and custom TTF font rendering.
3. **Phase 3**: ESP-IDF C++ code generator output.
4. **Phase 4**: Browser WebUSB / WebSerial flashing directly to physical ESP32 boards.
