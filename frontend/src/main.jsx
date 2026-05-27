import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertTriangle, CheckCircle2, CircleDashed, Database, RefreshCw, Server } from 'lucide-react';
import './styles.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const statuses = ['queued', 'running', 'blocked', 'done'];

function App() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ tasks: [], incidents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', owner: '', priority: 'medium' });

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [tasksResponse, summaryResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/tasks`),
        fetch(`${apiBaseUrl}/api/summary`)
      ]);
      if (!tasksResponse.ok || !summaryResponse.ok) {
        throw new Error('The API did not return dashboard data.');
      }
      setTasks(await tasksResponse.json());
      setSummary(await summaryResponse.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    const byStatus = Object.fromEntries(statuses.map((status) => [status, 0]));
    for (const item of summary.tasks || []) {
      byStatus[item.status] = item.count;
    }
    const openIncidents = (summary.incidents || [])
      .filter((incident) => incident.status === 'open')
      .reduce((total, incident) => total + incident.count, 0);
    return { byStatus, openIncidents };
  }, [summary]);

  async function createTask(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.owner.trim()) {
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      setForm({ title: '', owner: '', priority: 'medium' });
      loadData();
    }
  }

  async function updateStatus(id, status) {
    await fetch(`${apiBaseUrl}/api/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadData();
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Activity size={24} />
          <span>OpsPulse</span>
        </div>
        <nav>
          <a className="active" href="#overview">Overview</a>
          <a href="#tasks">Tasks</a>
          <a href="http://localhost:9090">Prometheus</a>
          <a href="http://localhost:3001">Grafana</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Production operations</p>
            <h1>Service delivery dashboard</h1>
          </div>
          <button className="iconButton" onClick={loadData} disabled={loading} title="Refresh dashboard">
            <RefreshCw size={18} />
          </button>
        </header>

        {error && <div className="alert">{error}</div>}

        <section className="metrics" id="overview">
          <Metric icon={<CircleDashed />} label="Queued" value={totals.byStatus.queued} />
          <Metric icon={<Server />} label="Running" value={totals.byStatus.running} />
          <Metric icon={<AlertTriangle />} label="Blocked" value={totals.byStatus.blocked} />
          <Metric icon={<CheckCircle2 />} label="Done" value={totals.byStatus.done} />
          <Metric icon={<Database />} label="Open incidents" value={totals.openIncidents} />
        </section>

        <section className="taskPanel" id="tasks">
          <div className="panelHeader">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2>Task queue</h2>
            </div>
          </div>

          <form className="taskForm" onSubmit={createTask}>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Task title"
            />
            <input
              value={form.owner}
              onChange={(event) => setForm({ ...form, owner: event.target.value })}
              placeholder="Owner"
            />
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button type="submit">Add task</button>
          </form>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.owner}</td>
                    <td><span className={`priority ${task.priority}`}>{task.priority}</span></td>
                    <td>
                      <select value={task.status} onChange={(event) => updateStatus(task.id, event.target.value)}>
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }) {
  return (
    <article className="metric">
      <div className="metricIcon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value ?? 0}</strong>
      </div>
    </article>
  );
}

createRoot(document.getElementById('root')).render(<App />);

