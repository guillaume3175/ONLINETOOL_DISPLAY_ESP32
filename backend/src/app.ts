import express, { Request, Response } from 'express';
import cors from 'cors';
import { parseYamlToProject, generateYamlFromProject } from '@esp32-designer/shared';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'esp32-designer-backend' });
});

app.post('/api/project/parse', (req: Request, res: Response) => {
  const { yaml } = req.body;
  if (typeof yaml !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "yaml" string field in body' });
  }

  const project = parseYamlToProject(yaml);
  res.json(project);
});

app.post('/api/project/validate', (req: Request, res: Response) => {
  const { yaml } = req.body;
  if (typeof yaml !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "yaml" string field in body' });
  }

  const project = parseYamlToProject(yaml);
  res.json({
    valid: !project.validationIssues.some(i => i.type === 'ERROR'),
    issues: project.validationIssues
  });
});

app.post('/api/project/generate-yaml', (req: Request, res: Response) => {
  const { project } = req.body;
  if (!project || typeof project !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid "project" object in body' });
  }

  const generatedYaml = generateYamlFromProject(project);
  res.json({ yaml: generatedYaml });
});

app.get('/api/project/schema', (req: Request, res: Response) => {
  res.json({
    supportedBoards: ['esp32-s3-devkitc-1', 'esp32-c3-devkitm-1', 'waveshare-esp32-s3-147'],
    supportedDisplays: ['st7789v', 'ili9341', 'gc9a01', 'sh1106', 'ssd1306'],
    supportedTouchControllers: ['cst816s', 'ft6336u', 'gt911', 'xpt2046'],
    supportedWidgets: [
      'label',
      'button',
      'slider',
      'switch',
      'checkbox',
      'textarea',
      'bar',
      'arc',
      'dropdown',
      'container',
      'meter',
      'image',
      'page',
      'tabview'
    ]
  });
});
