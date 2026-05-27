import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('health endpoint reports service status', async () => {
  const app = createApp();
  const response = await request(app).get('/healthz');

  assert.equal(response.status, 200);
  assert.equal(response.body.service, 'opspulse-api');
});

