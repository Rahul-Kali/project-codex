INSERT INTO tasks (title, owner, priority, status) VALUES
  ('Ship checkout tracing', 'Platform', 'high', 'running'),
  ('Patch billing worker', 'Payments', 'critical', 'queued'),
  ('Tune dashboard queries', 'Data', 'medium', 'blocked'),
  ('Verify backup restore', 'SRE', 'high', 'done')
ON CONFLICT DO NOTHING;

INSERT INTO incidents (service_name, severity, status, resolved_at) VALUES
  ('api', 'sev2', 'mitigated', NOW()),
  ('worker', 'sev3', 'closed', NOW()),
  ('frontend', 'sev3', 'open', NULL)
ON CONFLICT DO NOTHING;

