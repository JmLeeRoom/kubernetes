# 사용 가이드

> MLOps Platform 설치, 개발, 배포, 운영 가이드

---

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [로컬 개발 환경 설정](#2-로컬-개발-환경-설정)
3. [개발 서버 실행](#3-개발-서버-실행)
4. [Docker Compose 실행](#4-docker-compose-실행)
5. [Kubernetes 배포](#5-kubernetes-배포)
6. [Keycloak SSO 설정](#6-keycloak-sso-설정)
7. [프로젝트 구조](#7-프로젝트-구조)
8. [API 엔드포인트 레퍼런스](#8-api-엔드포인트-레퍼런스)
9. [환경변수 레퍼런스](#9-환경변수-레퍼런스)
10. [문제 해결 및 FAQ](#10-문제-해결-및-faq)

---

## 1. 사전 요구사항

### 1.1 필수 도구

| 도구 | 최소 버전 | 설치 |
|------|----------|------|
| Node.js | 20.x LTS | `nvm install 20` |
| pnpm | 8.x | `npm install -g pnpm@8` |
| Python | 3.11+ | `pyenv install 3.11.9` |
| Docker | 24+ | Docker Desktop 또는 Docker Engine |
| kubectl | 1.29+ | [공식 문서](https://kubernetes.io/docs/tasks/tools/) |
| Helm | 3.14+ | `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \| bash` |

### 1.2 선택적 도구

| 도구 | 용도 |
|------|------|
| kind / minikube | 로컬 Kubernetes 클러스터 |
| jq | JSON 처리 (Keycloak 스크립트에서 사용) |
| Playwright | E2E 테스트 |

---

## 2. 로컬 개발 환경 설정

### 2.1 저장소 클론 및 초기 설정

```bash
git clone <repository-url> mlops-platform
cd mlops-platform
```

### 2.2 프론트엔드 설정

```bash
# 루트에서 의존성 설치 (pnpm workspace)
pnpm install

# 환경변수 설정
cp .env.example .env
```

### 2.3 백엔드 설정

```bash
cd packages/backend

# Python 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# 의존성 설치
pip install -r requirements.txt
pip install -r requirements-dev.txt  # 개발/테스트 의존성
```

### 2.4 E2E 테스트 설정 (선택)

```bash
cd e2e
pnpm install
npx playwright install  # 브라우저 다운로드
```

---

## 3. 개발 서버 실행

### 3.1 프론트엔드만 실행 (MSW 모드)

백엔드 없이 프론트엔드만 실행할 수 있습니다. MSW가 API 응답을 모킹합니다.

```bash
cd packages/frontend
VITE_MSW_ENABLED=true pnpm dev
```

브라우저에서 `http://localhost:5173` 접속

이 모드에서는:
- 모든 API 응답이 MSW 핸들러에서 생성된 가짜 데이터입니다.
- 프론트엔드 UI 개발과 디자인 작업에 적합합니다.
- 인증이 비활성화되어 자유롭게 모든 페이지에 접근할 수 있습니다.

### 3.2 프론트엔드 + 백엔드 함께 실행

여러 터미널에서 서비스를 개별 실행합니다:

**터미널 1 — 프론트엔드:**
```bash
cd packages/frontend
pnpm dev
# → http://localhost:5173
```

**터미널 2 — API Gateway:**
```bash
cd packages/backend
source .venv/bin/activate
AUTH_VERIFY_TOKEN=false uvicorn api_gateway.main:app --port 8000 --reload
```

**터미널 3 — 모니터링 서비스:**
```bash
cd packages/backend
source .venv/bin/activate
uvicorn monitoring_svc.main:app --port 8001 --reload
```

**터미널 4 — 기타 서비스 (필요 시):**
```bash
uvicorn pipeline_svc.main:app --port 8002 --reload
uvicorn serving_svc.main:app --port 8003 --reload
uvicorn mlops_svc.main:app --port 8004 --reload
```

> **참고:** `AUTH_VERIFY_TOKEN=false`를 설정하면 JWT 검증을 건너뜁니다. 로컬 개발에서 Keycloak 없이 작업할 때 사용하세요.

### 3.3 kubectl port-forward (실제 K8s 연동 시)

클러스터의 도구에 접근해야 하는 경우:

```bash
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090 &
kubectl port-forward -n monitoring svc/loki 3100:3100 &
kubectl port-forward -n monitoring svc/tempo 3200:3200 &
```

---

## 4. Docker Compose 실행

모든 서비스를 한 번에 실행하는 가장 간단한 방법입니다.

### 4.1 전체 스택 시작

```bash
# 프로젝트 루트에서
docker compose up -d
```

### 4.2 서비스 접속

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:5173 |
| API Gateway | http://localhost:8000 |
| Monitoring Service | http://localhost:8001 |
| Pipeline Service | http://localhost:8002 |
| Serving Service | http://localhost:8003 |
| MLOps Service | http://localhost:8004 |
| Redis | localhost:6379 |

### 4.3 로그 확인

```bash
# 모든 서비스 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f api-gateway

# 서비스 상태 확인
docker compose ps
```

### 4.4 서비스 중지

```bash
docker compose down

# 볼륨 포함 삭제
docker compose down -v
```

### 4.5 이미지 재빌드

코드 변경 후 이미지를 재빌드하려면:

```bash
docker compose build
docker compose up -d
```

---

## 5. Kubernetes 배포

### 5.1 Helm 차트 구조

```
charts/
├── mlops-platform/
│   ├── Chart.yaml              # 차트 메타데이터
│   ├── values.yaml             # 기본 설정값
│   └── templates/
│       ├── _helpers.tpl        # 공용 헬퍼 함수
│       ├── api-gateway/        # Deployment, Service, ConfigMap
│       ├── monitoring-svc/     # Deployment, Service, ConfigMap
│       ├── pipeline-svc/       # Deployment, Service, ConfigMap
│       ├── serving-svc/        # Deployment, Service, ConfigMap
│       ├── mlops-svc/          # Deployment, Service, ConfigMap
│       ├── frontend/           # Deployment, Service
│       ├── ingress/            # Ingress (Nginx)
│       └── rbac/               # ServiceAccount, ClusterRole, ClusterRoleBinding
└── overrides/
    └── oauth2-proxy-values.yaml  # OAuth2-Proxy SSO 설정
```

### 5.2 배포 전 검증

```bash
# Lint 검증
helm lint charts/mlops-platform/

# 템플릿 렌더링 미리보기
helm template mlops-platform charts/mlops-platform/ \
  --set global.domain=company.com \
  | less

# 드라이런 (실제 배포하지 않음)
helm install mlops-platform charts/mlops-platform/ \
  --namespace mlops-system \
  --create-namespace \
  --dry-run
```

### 5.3 배포

```bash
# 기본 설정으로 배포
helm install mlops-platform charts/mlops-platform/ \
  --namespace mlops-system \
  --create-namespace

# 커스텀 도메인으로 배포
helm install mlops-platform charts/mlops-platform/ \
  --namespace mlops-system \
  --create-namespace \
  --set global.domain=mlops.mycompany.com \
  --set global.imageTag=v1.0.0

# 커스텀 values 파일 사용
helm install mlops-platform charts/mlops-platform/ \
  --namespace mlops-system \
  --create-namespace \
  -f my-values.yaml
```

### 5.4 배포 확인

```bash
# Pod 상태 확인
kubectl get pods -n mlops-system

# 서비스 확인
kubectl get svc -n mlops-system

# Ingress 확인
kubectl get ingress -n mlops-system

# 특정 Pod 로그 확인
kubectl logs -n mlops-system deployment/api-gateway -f
```

### 5.5 업그레이드 및 롤백

```bash
# 업그레이드
helm upgrade mlops-platform charts/mlops-platform/ \
  --namespace mlops-system \
  --set global.imageTag=v1.1.0

# 롤백
helm rollback mlops-platform 1 --namespace mlops-system

# 삭제
helm uninstall mlops-platform --namespace mlops-system
```

### 5.6 주요 values.yaml 설정

| 키 | 설명 | 기본값 |
|----|------|--------|
| `global.domain` | 서비스 도메인 | `mlops.company.com` |
| `global.imageRegistry` | 컨테이너 레지스트리 | `ghcr.io/company/mlops-platform` |
| `global.imageTag` | 이미지 태그 | `0.1.0` |
| `frontend.replicas` | 프론트엔드 레플리카 수 | `2` |
| `apiGateway.replicas` | API Gateway 레플리카 수 | `2` |
| `ingress.enabled` | Ingress 활성화 여부 | `true` |
| `ingress.tls.enabled` | TLS 활성화 여부 | `false` |
| `serviceAccount.create` | ServiceAccount 생성 | `true` |

---

## 6. Keycloak SSO 설정

### 6.1 Keycloak 설치

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

helm upgrade --install keycloak bitnami/keycloak \
  --namespace mlops-auth --create-namespace \
  --set auth.adminUser=admin \
  --set auth.adminPassword="$(openssl rand -base64 24)" \
  --set ingress.enabled=true \
  --set ingress.hostname=keycloak.company.com \
  --set postgresql.enabled=true
```

### 6.2 Realm 초기화

```bash
export KEYCLOAK_URL="https://keycloak.company.com"
export KEYCLOAK_ADMIN_PASSWORD="<위에서 생성한 비밀번호>"

# Realm, 클라이언트, 그룹을 자동으로 설정합니다
bash scripts/setup-keycloak-realm.sh
```

생성되는 항목:
- **Realm**: `mlops-platform`
- **Client**: `mlops-dashboard` (OIDC, Confidential)
- **Groups**: `admin`, `ml-engineer`, `viewer`

### 6.3 OAuth2-Proxy 설치

```bash
helm repo add oauth2-proxy https://oauth2-proxy.github.io/manifests
helm repo update

# 시크릿 값 설정
export KEYCLOAK_CLIENT_SECRET="<Keycloak에서 확인>"
export COOKIE_SECRET_32_BYTES_BASE64="$(openssl rand -base64 32)"

# 설치
envsubst < charts/overrides/oauth2-proxy-values.yaml | \
  helm upgrade --install oauth2-proxy oauth2-proxy/oauth2-proxy \
  --namespace mlops-auth \
  -f -
```

### 6.4 사용자 관리

Keycloak 관리 콘솔 (`https://keycloak.company.com`)에서:

1. **사용자 추가**: Users → Add user → 비밀번호 설정
2. **그룹 할당**: 생성한 사용자 → Groups 탭 → Join group
3. **역할 확인**: Groups 탭에서 할당된 그룹 확인

| 그룹 | 역할 | 권한 |
|------|------|------|
| `admin` | 관리자 | 모든 기능 접근, 설정 변경 |
| `ml-engineer` | ML 엔지니어 | 모델 배포, 실험 관리, 파이프라인 제어 |
| `viewer` | 뷰어 | 읽기 전용 접근 |

---

## 7. 프로젝트 구조

```
mlops-platform/
├── packages/
│   ├── frontend/                    # React 18 SPA
│   │   ├── src/
│   │   │   ├── app/                 # 라우터, 프로바이더, 엔트리포인트
│   │   │   ├── components/
│   │   │   │   ├── ui/              # shadcn/ui 컴포넌트 (13개)
│   │   │   │   ├── common/          # MetricCard, StatusBadge 등
│   │   │   │   └── layout/          # AppShell, Sidebar, TopNav
│   │   │   ├── features/
│   │   │   │   ├── monitoring/      # 클러스터, 메트릭, 로그, 트레이스, 알림
│   │   │   │   ├── pipeline/        # Airbyte, Prefect, Spark
│   │   │   │   ├── serving/         # KServe, 트래픽, 배포
│   │   │   │   ├── mlops/           # MLflow, Airflow, 리니지
│   │   │   │   └── auth/            # 로그인, 인증 가드
│   │   │   ├── stores/              # Zustand 상태 관리
│   │   │   ├── hooks/               # useSSE, useWebSocket, usePermission
│   │   │   ├── lib/                 # api, auth, formatters, utils
│   │   │   ├── mocks/              # MSW 핸들러 (도메인별)
│   │   │   └── test/               # 테스트 유틸, 설정
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── backend/                     # FastAPI 마이크로서비스
│       ├── api_gateway/             # :8000 — 인증, 라우팅, Rate Limiting
│       │   ├── main.py
│       │   ├── config.py
│       │   ├── middleware/          # auth, logging, rate_limit
│       │   └── routers/            # auth, monitoring, pipeline, serving, mlops
│       ├── monitoring_svc/          # :8001 — Prometheus, Loki, Tempo, K8s
│       │   ├── main.py
│       │   ├── clients/            # prometheus, loki, tempo, k8s_client
│       │   └── routers/            # metrics, logs, traces, k8s, alerts
│       ├── pipeline_svc/            # :8002 — Airbyte, Prefect, Spark
│       │   ├── main.py
│       │   ├── clients/            # airbyte, prefect, spark
│       │   └── routers/            # airbyte, prefect, spark
│       ├── serving_svc/             # :8003 — KServe, Prometheus
│       │   ├── main.py
│       │   ├── clients/            # kserve, prometheus
│       │   └── routers/            # inference
│       ├── mlops_svc/               # :8004 — MLflow, Airflow
│       │   ├── main.py
│       │   ├── clients/            # mlflow_client, airflow_client
│       │   └── routers/            # mlflow, airflow, lineage
│       ├── shared/                  # 공용 모듈
│       │   ├── auth.py             # JWT 검증 (Keycloak JWKS)
│       │   ├── cache.py            # Redis 클라이언트
│       │   ├── exceptions.py       # 커스텀 HTTP 예외
│       │   ├── logging.py          # structlog 설정
│       │   └── models.py           # 공용 Pydantic 모델
│       ├── tests/                   # pytest 테스트
│       ├── Dockerfile
│       └── requirements.txt
│
├── charts/                          # Helm 차트
│   ├── mlops-platform/
│   └── overrides/
├── e2e/                             # Playwright E2E 테스트
├── scripts/                         # 유틸리티 스크립트
├── docs/                            # 문서
│   ├── adr/                        # 아키텍처 결정 기록
│   └── guide/                      # 사용/테스트 가이드
├── .github/workflows/ci.yml        # CI 파이프라인
├── docker-compose.yml               # 로컬 개발용
└── .env.example                     # 환경변수 템플릿
```

---

## 8. API 엔드포인트 레퍼런스

모든 API는 API Gateway(`/api/v1`)를 통해 접근합니다.

### 8.1 인증 (`/api/v1/auth`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/auth/login` | Keycloak 로그인 (토큰 발급) |
| POST | `/auth/refresh` | 토큰 갱신 |
| GET | `/auth/me` | 현재 사용자 정보 |

### 8.2 모니터링 (`/api/v1/monitoring`)

API Gateway가 내부적으로 `monitoring-svc`로 프록시합니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/metrics/query_range` | Prometheus 범위 쿼리 |
| GET | `/metrics/stream` | SSE 메트릭 스트리밍 (5초 간격) |
| GET | `/logs/query` | Loki 로그 쿼리 |
| GET | `/traces/search` | Tempo 트레이스 검색 |
| GET | `/traces/{trace_id}` | 특정 트레이스 상세 |
| GET | `/k8s/nodes` | K8s 노드 목록 |
| GET | `/k8s/pods` | K8s Pod 목록 |
| GET | `/k8s/events` | K8s 이벤트 스트리밍 |
| GET | `/alerts/` | Prometheus 알림 목록 |
| POST | `/alerts/{alert_id}/silence` | 알림 무음 처리 |

### 8.3 파이프라인 (`/api/v1/pipeline`)

API Gateway가 내부적으로 `pipeline-svc`로 프록시합니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/connections/` | Airbyte 연결 목록 |
| GET | `/connections/{id}` | 연결 상세 |
| POST | `/connections/{id}/sync` | 동기화 트리거 |
| GET | `/connections/{id}/jobs` | 동기화 작업 목록 |
| GET | `/flows/` | Prefect Flow 목록 |
| GET | `/flows/runs` | Flow Run 목록 |
| POST | `/flows/runs/{id}/cancel` | Flow Run 취소 |
| GET | `/spark/jobs` | Spark Job 목록 |
| GET | `/spark/jobs/{app_id}/{job_id}` | Spark Job 상세 |
| GET | `/spark/stages/{app_id}` | Spark Stage 목록 |

### 8.4 모델 서빙 (`/api/v1/serving`)

API Gateway가 내부적으로 `serving-svc`로 프록시합니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/inference-services/` | InferenceService 목록 |
| POST | `/inference-services/` | InferenceService 생성 |
| GET | `/inference-services/{name}` | InferenceService 상세 |
| DELETE | `/inference-services/{name}` | InferenceService 삭제 |
| PATCH | `/inference-services/{name}/traffic` | 트래픽 분할 업데이트 |
| GET | `/inference-services/{name}/metrics` | 모델 메트릭 (RPS, Latency) |

### 8.5 MLOps (`/api/v1/mlops`)

API Gateway가 내부적으로 `mlops-svc`로 프록시합니다.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/experiments/` | MLflow 실험 목록 |
| GET | `/experiments/{id}/runs` | 실험의 Run 목록 |
| POST | `/experiments/runs/compare` | Run 비교 |
| GET | `/experiments/models` | 등록된 모델 목록 |
| GET | `/experiments/models/{name}/versions` | 모델 버전 목록 |
| POST | `/experiments/models/{name}/versions/{ver}/stage` | 모델 스테이지 전환 |
| GET | `/dags/` | Airflow DAG 목록 |
| POST | `/dags/{dag_id}/trigger` | DAG 실행 트리거 |
| GET | `/dags/{dag_id}/graph` | DAG 그래프 구조 |
| PATCH | `/dags/{dag_id}/pause` | DAG 일시정지/재개 |
| GET | `/dags/{dag_id}/runs` | DAG Run 목록 |
| GET | `/lineage/` | 아티팩트 리니지 |

### 8.6 헬스체크

각 서비스는 `/health` 엔드포인트를 제공합니다:

```bash
# API Gateway
curl http://localhost:8000/health

# 개별 서비스
curl http://localhost:8001/health  # monitoring
curl http://localhost:8002/health  # pipeline
curl http://localhost:8003/health  # serving
curl http://localhost:8004/health  # mlops
```

---

## 9. 환경변수 레퍼런스

`.env.example`을 복사하여 `.env`를 생성하고 값을 설정합니다.

### 프론트엔드

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VITE_API_BASE_URL` | API 기본 URL | `/api/v1` |
| `VITE_MSW_ENABLED` | MSW 모킹 활성화 | `false` |

### API Gateway (`GATEWAY_` 접두사)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `GATEWAY_MONITORING_SVC_URL` | 모니터링 서비스 URL | `http://monitoring-svc:8001` |
| `GATEWAY_PIPELINE_SVC_URL` | 파이프라인 서비스 URL | `http://pipeline-svc:8002` |
| `GATEWAY_SERVING_SVC_URL` | 서빙 서비스 URL | `http://serving-svc:8003` |
| `GATEWAY_MLOPS_SVC_URL` | MLOps 서비스 URL | `http://mlops-svc:8004` |
| `GATEWAY_REDIS_URL` | Redis URL | `redis://localhost:6379/0` |
| `GATEWAY_CORS_ORIGINS` | 허용 CORS 출처 (JSON 배열) | `["http://localhost:5173"]` |
| `GATEWAY_RATE_LIMIT_REQUESTS` | 요청 제한 (윈도우당) | `100` |
| `GATEWAY_RATE_LIMIT_WINDOW` | 제한 윈도우 (초) | `60` |
| `GATEWAY_AUTH_KEYCLOAK_URL` | Keycloak URL | |
| `GATEWAY_AUTH_REALM` | Keycloak Realm | `mlops-platform` |
| `GATEWAY_AUTH_CLIENT_ID` | Keycloak Client ID | `mlops-dashboard` |
| `GATEWAY_AUTH_CLIENT_SECRET` | Keycloak Client Secret | |
| `GATEWAY_PROXY_TIMEOUT` | 프록시 타임아웃 (초) | `30` |

### 모니터링 서비스 (`MONITORING_` 접두사)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `MONITORING_PROMETHEUS_URL` | Prometheus URL | `http://prometheus:9090` |
| `MONITORING_LOKI_URL` | Loki URL | `http://loki:3100` |
| `MONITORING_TEMPO_URL` | Tempo URL | `http://tempo:3200` |
| `MONITORING_REDIS_URL` | Redis URL | `redis://localhost:6379` |
| `MONITORING_LOG_LEVEL` | 로그 레벨 | `INFO` |

### 파이프라인 서비스 (`PIPELINE_` 접두사)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PIPELINE_AIRBYTE_URL` | Airbyte 서버 URL | `http://airbyte-server:8001` |
| `PIPELINE_AIRBYTE_USERNAME` | Airbyte 사용자명 | `airbyte` |
| `PIPELINE_AIRBYTE_PASSWORD` | Airbyte 비밀번호 | |
| `PIPELINE_AIRBYTE_WORKSPACE_ID` | Airbyte Workspace ID | `default` |
| `PIPELINE_PREFECT_URL` | Prefect 서버 URL | `http://prefect-server:4200` |
| `PIPELINE_SPARK_URL` | Spark Master URL | `http://spark-master:8080` |
| `PIPELINE_REDIS_URL` | Redis URL | `redis://localhost:6379/0` |

### 서빙 서비스 (`SERVING_` 접두사)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `SERVING_KSERVE_NAMESPACE` | KServe 네임스페이스 | `model-serving` |
| `SERVING_PROMETHEUS_URL` | Prometheus URL | `http://prometheus:9090` |

### MLOps 서비스 (`MLOPS_` 접두사)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `MLOPS_MLFLOW_URL` | MLflow Tracking URL | `http://mlflow:5000` |
| `MLOPS_AIRFLOW_URL` | Airflow Webserver URL | `http://airflow-webserver:8080` |
| `MLOPS_AIRFLOW_USERNAME` | Airflow 사용자명 | `admin` |
| `MLOPS_AIRFLOW_PASSWORD` | Airflow 비밀번호 | |

### 인증 (`AUTH_` 접두사)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `AUTH_KEYCLOAK_URL` | Keycloak URL | |
| `AUTH_REALM` | Keycloak Realm | `mlops-platform` |
| `AUTH_CLIENT_ID` | Keycloak Client ID | `mlops-dashboard` |
| `AUTH_CLIENT_SECRET` | Keycloak Client Secret | |
| `AUTH_VERIFY_TOKEN` | JWT 검증 활성화 | `true` |

---

## 10. 문제 해결 및 FAQ

### Q: 프론트엔드 빌드가 실패합니다

```bash
# node_modules 재설치
rm -rf node_modules packages/frontend/node_modules
pnpm install
```

### Q: 백엔드 서비스가 시작되지 않습니다

1. 가상환경이 활성화되었는지 확인하세요:
   ```bash
   which python3  # .venv/bin/python3 이어야 함
   ```
2. 의존성이 설치되었는지 확인하세요:
   ```bash
   pip install -r requirements.txt
   ```
3. 필요한 환경변수가 설정되었는지 확인하세요.

### Q: Docker Compose에서 서비스가 연결되지 않습니다

```bash
# 서비스 상태 확인
docker compose ps

# Redis 연결 확인
docker compose exec redis redis-cli ping
# → PONG

# 특정 서비스 재빌드
docker compose build api-gateway
docker compose up -d api-gateway
```

### Q: Helm 배포 후 Pod이 CrashLoopBackOff 상태입니다

```bash
# Pod 로그 확인
kubectl logs -n mlops-system deployment/api-gateway

# Pod 상세 상태 확인
kubectl describe pod -n mlops-system -l app=api-gateway

# ConfigMap 확인
kubectl get configmap -n mlops-system
```

### Q: Keycloak 로그인이 실패합니다

1. Keycloak이 실행 중인지 확인합니다:
   ```bash
   curl -s https://keycloak.company.com/realms/mlops-platform/.well-known/openid-configuration | jq .issuer
   ```
2. Client Secret이 올바른지 확인합니다.
3. Redirect URI가 올바르게 설정되었는지 확인합니다.

### Q: API 응답이 502 Bad Gateway입니다

API Gateway가 다운스트림 서비스에 연결할 수 없다는 의미입니다:

1. 대상 서비스가 실행 중인지 확인합니다.
2. `GATEWAY_*_SVC_URL` 환경변수가 올바른지 확인합니다.
3. Docker Compose 사용 시 서비스 이름이 올바른지 확인합니다.

### Q: MSW 모드에서 특정 API가 동작하지 않습니다

해당 엔드포인트의 MSW 핸들러가 있는지 확인하세요:

```
src/mocks/handlers/
├── auth.ts
├── monitoring.ts
├── pipeline.ts
├── serving.ts
└── mlops.ts
```

새 엔드포인트를 추가했다면 해당 핸들러 파일에 모킹을 추가해야 합니다.
