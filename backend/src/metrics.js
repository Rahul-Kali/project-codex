import client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'opspulse_' });

export const httpRequestDuration = new client.Histogram({
  name: 'opspulse_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'opspulse_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const dbQueryDuration = new client.Histogram({
  name: 'opspulse_db_query_duration_seconds',
  help: 'Duration of PostgreSQL queries in seconds',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
});

export const taskStatusGauge = new client.Gauge({
  name: 'opspulse_tasks_by_status',
  help: 'Current task count grouped by status',
  labelNames: ['status']
});

globalThis.__dbQueryObserver = (durationMs) => {
  dbQueryDuration.observe(durationMs / 1000);
};

export function metricsMiddleware(req, res, next) {
  const started = performance.now();

  res.on('finish', () => {
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, (performance.now() - started) / 1000);
  });

  next();
}

export async function metricsResponse() {
  return client.register.metrics();
}

export function metricsContentType() {
  return client.register.contentType;
}

