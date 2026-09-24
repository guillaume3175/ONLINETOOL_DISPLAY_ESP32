import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Backend REST API', () => {
  it('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/project/parse parses YAML into project model', async () => {
    const sampleYaml = `
display:
  width: 172
  height: 320
lvgl:
  widgets:
    - label:
        text: "API Test"
`;
    const res = await request(app).post('/api/project/parse').send({ yaml: sampleYaml });
    expect(res.status).toBe(200);
    expect(res.body.display.width).toBe(172);
    expect(res.body.lvgl.widgets.length).toBe(1);
    expect(res.body.lvgl.widgets[0].text).toBe('API Test');
  });

  it('POST /api/project/validate validates syntax and warnings', async () => {
    const sampleYaml = `
display:
  width: 172
`;
    const res = await request(app).post('/api/project/validate').send({ yaml: sampleYaml });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.issues.length).toBeGreaterThan(0);
  });
});
