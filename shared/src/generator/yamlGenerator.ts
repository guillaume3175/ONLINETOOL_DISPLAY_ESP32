import { stringify } from 'yaml';
import { Esp32Project, LvglWidget } from '../types/project.js';

function formatWidgetForYaml(widget: LvglWidget): any {
  const obj: any = {};
  const props: any = { ...widget.properties };

  if (widget.x !== undefined) props.x = widget.x;
  if (widget.y !== undefined) props.y = widget.y;
  if (widget.width !== undefined) props.width = widget.width;
  if (widget.height !== undefined) props.height = widget.height;
  if (widget.text !== undefined) props.text = widget.text;
  if (widget.value !== undefined) props.value = widget.value;
  if (widget.minValue !== undefined) props.min_value = widget.minValue;
  if (widget.maxValue !== undefined) props.max_value = widget.maxValue;
  if (widget.checked !== undefined) props.checked = widget.checked;
  if (widget.options !== undefined) props.options = widget.options;

  if (widget.children && widget.children.length > 0) {
    props.widgets = widget.children.map(formatWidgetForYaml);
  }

  obj[widget.type] = props;
  return obj;
}

export function generateYamlFromProject(project: Esp32Project): string {
  const yamlObj: any = {
    esphome: {
      name: project.board?.id || project.name || 'esp32-lvgl-project'
    },
    esp32: {
      board: project.board?.board || 'esp32-s3-devkitc-1'
    },
    display: [
      {
        id: project.display.id,
        platform: project.display.platform || 'st7789v',
        model: project.display.model || 'Custom',
        width: project.display.width,
        height: project.display.height,
        rotation: project.display.rotation
      }
    ]
  };

  if (project.touchscreen) {
    yamlObj.touchscreen = [
      {
        id: project.touchscreen.id,
        platform: project.touchscreen.platform || 'cst816s'
      }
    ];
  }

  if (project.lvgl && project.lvgl.widgets) {
    yamlObj.lvgl = {
      displays: [project.display.id],
      widgets: project.lvgl.widgets.map(formatWidgetForYaml)
    };
  }

  return stringify(yamlObj);
}
