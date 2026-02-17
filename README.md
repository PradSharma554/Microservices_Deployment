# Microservices Deployment Platform — "DevOps Showcase"

An **Event Booking** microservices app wrapped in production-grade DevOps infrastructure. The app is intentionally simple — the infra (Docker, K8s, CI/CD, monitoring, GitOps, security scanning) is the star. Everything runs locally on Minikube for free.

## Tech Stack

- **Frontend**: Next.js + TailwindCSS
- **Backend**: 3 Express.js (Node.js) services — plain JavaScript
- **Database**: MongoDB (separate DB per service)
- **Message Queue**: Redis Pub/Sub
- **Container Orchestration**: Kubernetes (Minikube)
- **CI/CD**: GitHub Actions + GitHub Container Registry
- **IaC**: Terraform, Helm, Kustomize
- **Monitoring**: Prometheus + Grafana + Loki
- **GitOps**: ArgoCD
- **Security**: Trivy, Semgrep, kubeaudit

## Architecture

```
                    ┌──────────────┐
                    │   Frontend   │
                    │  (Next.js)   │
                    │   :3000      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐
     │Events Service│ │Bookings Svc  │ │Notifications Svc   │
     │  (Express)   │◄│  (Express)   │ │   (Express)        │
     │  :3001       │ │  :3002       │ │   :3003            │
     └──────┬───────┘ └──────┬───────┘ └────────┬───────────┘
            │                │                   │
            ▼                ▼                   ▼
     ┌──────────┐     ┌──────────┐        ┌──────────┐
     │MongoDB   │     │MongoDB   │        │MongoDB   │
     │events_db │     │bookings  │        │notif_db  │
     └──────────┘     └──────────┘        └──────────┘
                           │                   ▲
                           │   Redis Pub/Sub   │
                           └───────────────────┘
```

**Inter-service communication:**
- **Sync HTTP**: Bookings → Events (check availability, reserve/release tickets)
- **Async Redis Pub/Sub**: Bookings → Notifications (`booking.confirmed`, `booking.cancelled`)

## Repo Structure

```
Microservices_deployment/
├── apps/
│   ├── frontend/                 # Next.js + TailwindCSS
│   ├── events-service/           # Express + MongoDB
│   ├── bookings-service/         # Express + MongoDB + Redis pub
│   └── notifications-service/    # Express + MongoDB + Redis sub
├── k8s/
│   ├── base/                     # Kustomize base manifests
│   └── overlays/
│       ├── dev/
│       ├── staging/
│       └── prod/
├── helm/
│   └── event-booking/
├── terraform/
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   └── loki/
├── argocd/
├── .github/workflows/
│   ├── ci.yml                    # PR checks: lint → test → build → security
│   ├── deploy.yml                # Main: build → push GHCR → staging → prod (manual gate)
│   └── security.yml              # Trivy, Semgrep, kubeaudit
├── docker-compose.yml
├── docker-compose.override.yml   # Hot-reload for local dev
├── Makefile
├── .gitignore
└── README.md
```

## Services

### Events Service (`:3001`)

CRUD for events with availability tracking.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (query: status, page, limit, sort) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Cancel event (soft delete) |
| GET | `/api/events/:id/availability` | Check ticket availability |
| PATCH | `/api/events/:id/book` | Reserve tickets (internal) |
| PATCH | `/api/events/:id/cancel` | Release tickets (internal) |

**Event Model**: title, description, date, venue, capacity, bookedCount, price, imageUrl, status (draft/published/cancelled)

### Bookings Service (`:3002`)

Handles booking creation and cancellation. Communicates with Events Service via HTTP and publishes to Redis.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking (validates availability, reserves tickets, publishes to Redis) |
| GET | `/api/bookings` | List bookings (query: email, status, page, limit) |
| GET | `/api/bookings/:id` | Get single booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking (releases tickets, publishes to Redis) |

**Booking Model**: eventId, eventTitle (denormalized), eventDate (denormalized), customerName, customerEmail, ticketCount, totalPrice, status (confirmed/cancelled/pending)

### Notifications Service (`:3003`)

Event-driven service. Subscribes to Redis channels and creates notification records.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications (query: email, type) |
| GET | `/api/notifications/:id` | Get single notification |

**Notification Model**: type (booking_confirmed/booking_cancelled/event_reminder), recipientEmail, subject, body, status (pending/sent/failed), metadata, sentAt

### All Services Expose

| Endpoint | Purpose |
|----------|---------|
| `/health` | Liveness probe (K8s) |
| `/ready` | Readiness probe (checks DB connection) |
| `/metrics` | Prometheus metrics (prom-client) |

## DevOps Layers

### 1. Containerization
- Multi-stage Dockerfiles for all 4 services
- Non-root users, `.dockerignore`, HEALTHCHECK instructions
- `docker-compose.yml`: 4 app containers + 3 MongoDB + 1 Redis
- `docker-compose.override.yml`: volume mounts + hot-reload for dev

### 2. Kubernetes (Minikube)
- Deployments, Services, ConfigMaps, Secrets
- NGINX Ingress controller with path-based routing
- HPA (Horizontal Pod Autoscaler) on Events and Bookings services
- Namespace separation: dev / staging / prod
- Liveness probes → `/health`, Readiness probes → `/ready`
- Resource requests and limits on all containers

### 3. CI/CD (GitHub Actions)
- **ci.yml** (PRs): detect changed services → lint → test → build image (dry run) → Semgrep + Trivy
- **deploy.yml** (main): build → push to GHCR → deploy staging → manual approval gate → deploy prod
- **security.yml**: Trivy image scan, Semgrep SAST, kubeaudit on K8s manifests

### 4. Infrastructure as Code
- **Kustomize**: base manifests + overlays per environment (dev/staging/prod) — used by ArgoCD
- **Helm**: `helm/event-booking/` chart with values per environment — alternative deployment method
- **Terraform**: provisions namespaces, monitoring stack, NGINX ingress, ArgoCD via Helm provider

### 5. Observability
- **Prometheus + Grafana**: kube-prometheus-stack Helm chart, ServiceMonitor for app metrics
- **App metrics**: request count, request duration histogram (prom-client)
- **Grafana dashboards**: request rate, latency P99, error rate, pod resources
- **Centralized logging**: Loki + Promtail

### 6. GitOps (ArgoCD)
- ArgoCD watches `k8s/overlays/{dev,staging,prod}` in this repo
- Auto-sync enabled for dev/staging
- Manual prune for prod (safety)

### 7. Security Scanning
- **Trivy**: container image vulnerability scanning in CI
- **Semgrep**: SAST for JavaScript/Node.js
- **kubeaudit**: K8s manifest security audit

## Build Progress

- [x] Project scaffold (git, .gitignore, directory structure)
- [x] Events Service (Express + MongoDB + metrics)
- [ ] Bookings Service (Express + MongoDB + Redis pub + Events HTTP client)
- [ ] Notifications Service (Express + MongoDB + Redis sub)
- [ ] Frontend (Next.js + TailwindCSS)
- [ ] Dockerfiles + Docker Compose
- [ ] Kubernetes manifests (Kustomize base + overlays)
- [ ] Helm charts
- [ ] GitHub Actions CI/CD pipelines
- [ ] Monitoring (Prometheus + Grafana + Loki)
- [ ] ArgoCD (GitOps)
- [ ] Terraform configs
- [ ] Makefile

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| 3 separate MongoDB instances (Docker Compose) | True microservice DB isolation |
| Denormalized eventTitle/eventDate in Booking | Avoids cross-service calls on reads |
| Redis Pub/Sub (not RabbitMQ/Kafka) | Already in stack, sufficient for showcase |
| Both Kustomize AND Helm | Demonstrates knowledge of both; ArgoCD uses Kustomize, Helm is alternative |
| No authentication | Intentionally simple — DevOps infra is the showcase |
| Plain JavaScript (not TypeScript) | Simplicity, faster iteration |
| Standalone Next.js output | Required for efficient Docker image without full node_modules |

## Quick Start

```bash
# Local dev with Docker Compose
make dev

# Run tests
make test

# Deploy to Minikube
make minikube-start
make deploy-dev

# Monitoring
make monitoring-install
make grafana-port-forward    # localhost:3030

# ArgoCD
make argocd-install
make argocd-port-forward     # localhost:8080
```
