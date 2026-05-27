# OpsPulse Full-Stack Observability Project

OpsPulse is a complete sample application with a React frontend, Node.js API, PostgreSQL database, Prometheus metrics, Grafana dashboards, Docker Compose, Kubernetes manifests, and GitHub Actions CI/CD.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express + PostgreSQL
- Database: PostgreSQL with SQL migrations and seed data
- Metrics: Prometheus `/metrics` endpoint via `prom-client`
- Monitoring: Prometheus + Grafana provisioning
- Containers: Dockerfiles and Docker Compose
- Kubernetes: API, frontend, database, Prometheus, Grafana manifests
- CI/CD: GitHub Actions for test, build, image publish, and Kubernetes deploy

## Local Run

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:8080
- API: http://localhost:3000
- API health: http://localhost:3000/healthz
- API metrics: http://localhost:3000/metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

Grafana login:

- Username: `admin`
- Password: `admin`

## API

```bash
curl http://localhost:3000/api/summary
curl http://localhost:3000/api/tasks
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Review SLO burn rate","owner":"SRE","priority":"high"}'
curl -X PATCH http://localhost:3000/api/tasks/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

## Kubernetes

Build and push images, then update image names in `k8s/api.yaml` and `k8s/frontend.yaml`.

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml
```

## CI/CD Secrets

For `.github/workflows/ci-cd.yml`, configure:

- `REGISTRY_USERNAME`
- `REGISTRY_TOKEN`
- `KUBE_CONFIG`

Set repository variables:

- `REGISTRY`, for example `ghcr.io/your-org`
- `IMAGE_NAMESPACE`, for example `opspulse`

## Jenkins

The root `Jenkinsfile` runs a CI/CD pipeline:

- Install backend and frontend dependencies
- Run backend and frontend tests
- Audit production dependencies
- Build backend and frontend artifacts
- Build and push Docker images
- Deploy all Kubernetes manifests
- Update Kubernetes deployments to the new image tag
- Wait for rollout status

Create these Jenkins credentials:

- `docker-registry-credentials`: username/password or token for your container registry
- `kubeconfig`: secret file containing your Kubernetes kubeconfig

Set these Jenkins build parameters:

- `REGISTRY`: for example `ghcr.io/your-github-username` or `docker.io/your-dockerhub-username`
- `IMAGE_NAMESPACE`: for example `project-codex`

The Jenkins agent must have Node.js, npm, Docker, kubectl, and access to the Docker daemon.
