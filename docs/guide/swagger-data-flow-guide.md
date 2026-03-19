# Swagger UI 및 데이터 흐름 가이드

> 각 백엔드 서비스의 Swagger 문서 접근 방법과 MLOps Platform을 통한 데이터 흐름 추적

---

## 목차

1. [Swagger UI 접근](#1-swagger-ui-접근)
2. [로컬 백엔드 서비스 시작](#2-로컬-백엔드-서비스-시작)
3. [API Gateway Swagger (포트 8000)](#3-api-gateway-swagger-포트-8000)
4. [모니터링 서비스 Swagger (포트 8001)](#4-모니터링-서비스-swagger-포트-8001)
5. [파이프라인 서비스 Swagger (포트 8002)](#5-파이프라인-서비스-swagger-포트-8002)
6. [서빙 서비스 Swagger (포트 8003)](#6-서빙-서비스-swagger-포트-8003)
7. [MLOps 서비스 Swagger (포트 8004)](#7-mlops-서비스-swagger-포트-8004)
8. [전체 데이터 흐름](#8-전체-데이터-흐름)
9. [Swagger로 데이터 흐름 테스트](#9-swagger로-데이터-흐름-테스트)
10. [Swagger 커스터마이징](#10-swagger-커스터마이징)

---

## 1. Swagger UI 접근

모든 FastAPI 서비스는 Swagger UI를 자동 생성합니다. 각 서비스는 3개의 문서 엔드포인트를 제공합니다:

| 엔드포인트 | 형식 | 설명 |
|-----------|------|------|
| `/docs` | Swagger UI | 인터랙티브 API 탐색기 (실시간 엔드포인트 테스트 가능) |
| `/redoc` | ReDoc | 읽기 전용 API 레퍼런스 |
| `/openapi.json` | JSON | OpenAPI 3.x 원본 스펙 |

### 서비스 URL

| 서비스 | 포트 | Swagger URL | 설명 |
|--------|------|-------------|------|
| API Gateway | 8000 | http://localhost:8000/docs | 진입점, 인증, 프록시 |
| 모니터링 | 8001 | http://localhost:8001/docs | Prometheus, Loki, Tempo, K8s |
| 파이프라인 | 8002 | http://localhost:8002/docs | Airbyte, Prefect, Spark |
| 서빙 | 8003 | http://localhost:8003/docs | KServe 추론 서비스 |
| MLOps | 8004 | http://localhost:8004/docs | MLflow, Airflow |

---

## 2. 로컬 백엔드 서비스 시작

### 2.1 전체 서비스 시작 (터미널 5개)

```bash
cd packages/backend
source .venv/bin/activate

# 터미널 1: API Gateway
uvicorn api_gateway.main:app --port 8000 --reload

# 터미널 2: 모니터링 서비스
uvicorn monitoring_svc.main:app --port 8001 --reload

# 터미널 3: 파이프라인 서비스
uvicorn pipeline_svc.main:app --port 8002 --reload

# 터미널 4: 서빙 서비스
uvicorn serving_svc.main:app --port 8003 --reload

# 터미널 5: MLOps 서비스
uvicorn mlops_svc.main:app --port 8004 --reload
```

### 2.2 빠른 시작 (단일 서비스)

테스트용으로 하나의 서비스만 필요한 경우:

```bash
# 게이트웨이만 (다른 서비스로 프록시)
uvicorn api_gateway.main:app --port 8000 --reload

# 또는 모니터링 서비스만 (독립 실행)
uvicorn monitoring_svc.main:app --port 8001 --reload
```

### 2.3 환경 변수

서비스 시작 전 설정:

```bash
# 로컬 개발용 인증 비활성화
export AUTH_VERIFY_TOKEN=false

# 선택: Redis (기본값 localhost:6379)
export GATEWAY_REDIS_URL=redis://localhost:6379/0
export MONITORING_REDIS_URL=redis://localhost:6379/0

# 선택: 디버그 모드 (JSON 대신 콘솔 로깅)
export GATEWAY_DEBUG=true
export MONITORING_DEBUG=true
```

### 2.4 서비스 정상 동작 확인

브라우저에서 health 엔드포인트로 이동:

```
http://localhost:8000/health    -> {"status":"ok","service":"api-gateway","version":"0.1.0",...}
http://localhost:8001/health    -> {"status":"ok","service":"monitoring-svc","version":"0.1.0",...}
http://localhost:8002/health    -> {"status":"ok","service":"pipeline-svc","version":"0.1.0",...}
http://localhost:8003/health    -> {"status":"ok","service":"serving-svc","version":"0.1.0",...}
http://localhost:8004/health    -> {"status":"ok","service":"mlops-svc","version":"0.1.0",...}
```

---

## 3. API Gateway Swagger (포트 8000)

**URL**: http://localhost:8000/docs

API Gateway는 단일 진입점입니다. 요청을 인증하고 백엔드 서비스로 프록시합니다.

### 엔드포인트

#### 인증 (`/api/v1/auth`)

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|----------|
| `POST` | `/api/v1/auth/login` | 사용자명/비밀번호로 로그인 | 아니오 |
| `POST` | `/api/v1/auth/refresh` | 액세스 토큰 갱신 | 아니오 |
| `GET` | `/api/v1/auth/me` | 현재 사용자 정보 조회 | 예 |

#### 프록시 라우트

| 메서드 | 경로 패턴 | 프록시 대상 |
|--------|----------|------------|
| `*` | `/api/v1/monitoring/{path}` | monitoring-svc:8001 |
| `*` | `/api/v1/pipeline/{path}` | pipeline-svc:8002 |
| `*` | `/api/v1/serving/{path}` | serving-svc:8003 |
| `*` | `/api/v1/mlops/{path}` | mlops-svc:8004 |

### 실습: 로그인 흐름

1. http://localhost:8000/docs 열기
2. `POST /api/v1/auth/login` 찾기
3. **Try it out** 클릭
4. 요청 본문 입력:
   ```json
   {
     "username": "admin",
     "password": "your-password"
   }
   ```
5. **Execute** 클릭
6. 응답:
   ```json
   {
     "access_token": "eyJhbGciOi...",
     "refresh_token": "eyJhbGciOi...",
     "token_type": "bearer",
     "expires_in": 900
   }
   ```
7. `access_token` 복사
8. **Authorize** 버튼 클릭 (우측 상단, 자물쇠 아이콘)
9. 입력: `Bearer eyJhbGciOi...`
10. 이후 모든 요청에 JWT가 자동 포함됨

### 실습: 게이트웨이를 통한 프록시

인증 후, 게이트웨이를 통해 다운스트림 서비스를 호출합니다:

```
GET /api/v1/monitoring/metrics/query_range?query=up&start=1709000000&end=1709100000&step=60s
```

요청 흐름:
```
브라우저 -> Gateway:8000 -> monitoring-svc:8001 -> Prometheus:9090
```

---

## 4. 모니터링 서비스 Swagger (포트 8001)

**URL**: http://localhost:8001/docs

### 엔드포인트

#### 메트릭 (`/metrics`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/metrics/query_range` | PromQL 범위 쿼리 | `query`, `start`, `end`, `step` |
| `GET` | `/metrics/stream` | SSE 메트릭 스트림 | `query`, `interval` |

#### 로그 (`/logs`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/logs/query` | LogQL 쿼리 | `query`, `start`, `end`, `limit` |
| `WS` | `/logs/stream` | WebSocket 로그 테일링 | `query` |

#### 트레이스 (`/traces`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/traces/search` | 트레이스 검색 | `service_name`, `operation`, `min_duration`, `max_duration`, `limit` |
| `GET` | `/traces/{trace_id}` | 단일 트레이스 조회 | `trace_id` |

#### 쿠버네티스 (`/k8s`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/k8s/nodes` | 클러스터 노드 목록 | - |
| `GET` | `/k8s/pods` | 파드 목록 | `namespace` |
| `GET` | `/k8s/events` | SSE 이벤트 스트림 | `namespace` |

#### 알림 (`/alerts`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/alerts/` | 발생 중인 알림 목록 | - |
| `POST` | `/alerts/{alert_id}/silence` | 알림 무음 설정 | `duration_hours`, `comment` |

### 실습: Prometheus 메트릭 쿼리

1. http://localhost:8001/docs 열기
2. `GET /metrics/query_range` 찾기
3. **Try it out** 클릭
4. 파라미터 입력:
   - `query`: `node_cpu_seconds_total`
   - `start`: `1709000000`
   - `end`: `1709100000`
   - `step`: `60s`
5. **Execute** 클릭
6. 응답 (Prometheus 반환):
   ```json
   {
     "resultType": "matrix",
     "result": [
       {
         "metric": {"__name__": "node_cpu_seconds_total", "cpu": "0", "mode": "idle"},
         "values": [[1709000000, "12345.67"], [1709000060, "12346.89"]]
       }
     ]
   }
   ```

### 데이터 흐름 다이어그램

```
Swagger UI (브라우저)
    │
    ▼
GET /metrics/query_range?query=up&start=...&end=...
    │
    ▼
┌──────────────────────┐
│ monitoring_svc       │
│ routers/metrics.py   │
│                      │
│ 1. Redis 캐시 확인    │──── 캐시 히트 ──▶ 캐시된 데이터 반환
│ 2. Prometheus 호출    │
│ 3. 캐시에 저장        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PrometheusClient     │
│ clients/prometheus.py│
│                      │
│ GET /api/v1/query_range
│   ?query=up          │
│   &start=...         │
│   &end=...           │
│   &step=15s          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Prometheus :9090     │
│ (업스트림)            │
└──────────────────────┘
```

---

## 5. 파이프라인 서비스 Swagger (포트 8002)

**URL**: http://localhost:8002/docs

### 엔드포인트

#### Airbyte 커넥션 (`/connections`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/connections/` | 데이터 커넥션 목록 |
| `GET` | `/connections/{connection_id}` | 커넥션 상세 조회 |
| `POST` | `/connections/{connection_id}/sync` | 데이터 동기화 트리거 |
| `GET` | `/connections/{connection_id}/jobs` | 동기화 작업 목록 |

#### Prefect 플로우 (`/flows`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/flows/` | 등록된 플로우 목록 | - |
| `GET` | `/flows/runs` | 플로우 실행 목록 | `limit`, `flow_id` |
| `POST` | `/flows/runs/{run_id}/cancel` | 플로우 실행 취소 | - |

#### Spark (`/spark`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/spark/jobs` | Spark 작업/앱 목록 | `app_id` |
| `GET` | `/spark/jobs/{app_id}/{job_id}` | 작업 상세 조회 | - |
| `GET` | `/spark/stages/{app_id}` | 작업 스테이지 목록 | - |

### 실습: 데이터 동기화 트리거

1. http://localhost:8002/docs 열기
2. `POST /connections/{connection_id}/sync` 찾기
3. **Try it out** 클릭
4. `connection_id` 입력: `your-connection-uuid`
5. **Execute** 클릭
6. 응답:
   ```json
   {
     "job": {
       "id": 42,
       "configType": "sync",
       "status": "pending"
     }
   }
   ```

### 데이터 흐름: Airbyte 동기화

```
Swagger UI
    │
    ▼
POST /connections/{id}/sync
    │
    ▼
┌──────────────────────┐
│ pipeline_svc         │
│ routers/airbyte.py   │
│                      │
│ _airbyte() 팩토리     │
│ -> AirbyteClient     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ AirbyteClient        │
│ clients/airbyte.py   │
│                      │
│ POST /v1/connections/sync
│   {"connectionId": id}
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Airbyte Server :8001 │
│ (업스트림)            │
└──────────────────────┘
```

---

## 6. 서빙 서비스 Swagger (포트 8003)

**URL**: http://localhost:8003/docs

### 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/inference-services/` | 전체 추론 서비스 목록 |
| `POST` | `/inference-services/` | 추론 서비스 생성 |
| `GET` | `/inference-services/{name}` | 추론 서비스 조회 |
| `DELETE` | `/inference-services/{name}` | 추론 서비스 삭제 |
| `PATCH` | `/inference-services/{name}/traffic` | 카나리 트래픽 비율 수정 |
| `GET` | `/inference-services/{name}/metrics` | RPS 및 지연시간 메트릭 조회 |

### 실습: 모델 배포

1. http://localhost:8003/docs 열기
2. `POST /inference-services/` 찾기
3. **Try it out** 클릭
4. 요청 본문 입력:
   ```json
   {
     "name": "fraud-detector",
     "framework": "sklearn",
     "model_uri": "s3://mlops-models/fraud-detector/v3",
     "min_replicas": 1,
     "max_replicas": 5,
     "cpu_request": "200m",
     "cpu_limit": "2",
     "memory_request": "512Mi",
     "memory_limit": "4Gi"
   }
   ```
5. **Execute** 클릭
6. 응답 (201 Created):
   ```json
   {
     "message": "InferenceService created",
     "name": "fraud-detector",
     "spec": { ... }
   }
   ```

### 실습: 카나리 배포

1. `PATCH /inference-services/{name}/traffic` 찾기
2. `name` 입력: `fraud-detector`
3. 요청 본문:
   ```json
   {
     "canary_percent": 20
   }
   ```
4. 응답:
   ```json
   {
     "name": "fraud-detector",
     "canary_percent": 20,
     "status": "updated"
   }
   ```

### 실습: 모델 메트릭 확인

1. `GET /inference-services/{name}/metrics` 찾기
2. `name` 입력: `fraud-detector`
3. 응답:
   ```json
   {
     "name": "fraud-detector",
     "metrics": {
       "rps": 142.5,
       "latency_p99_ms": 23.7
     }
   }
   ```

### 데이터 흐름: InferenceService 생성

```
Swagger UI
    │
    ▼
POST /inference-services/
  {"name": "fraud-detector", "framework": "sklearn", ...}
    │
    ▼
┌────────────────────────────┐
│ serving_svc                │
│ routers/inference.py       │
│                            │
│ 1. CreateRequest 유효성 검증│
│ 2. InferenceServiceSpec 생성│
│ 3. KServeClient.create 호출│
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ KServeClient               │
│ clients/kserve.py          │
│                            │
│ CRD 본문 생성:              │
│ {                          │
│   apiVersion: serving.     │
│     kserve.io/v1beta1      │
│   kind: InferenceService   │
│   spec.predictor.sklearn:  │
│     storageUri: s3://...   │
│ }                          │
│                            │
│ K8s CustomObjectsApi       │
│ .create_namespaced_        │
│  custom_object()           │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│ Kubernetes API Server      │
│                            │
│ "model-serving" 네임스페이스에│
│ InferenceService CRD 생성   │
└────────────────────────────┘
```

### 지원 프레임워크

| 프레임워크 | 값 |
|-----------|-----|
| Scikit-learn | `sklearn` |
| PyTorch | `pytorch` |
| TensorFlow | `tensorflow` |
| ONNX | `onnx` |
| XGBoost | `xgboost` |
| Triton | `triton` |

---

## 7. MLOps 서비스 Swagger (포트 8004)

**URL**: http://localhost:8004/docs

### 엔드포인트

#### MLflow 실험 (`/experiments`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/experiments/` | 실험 목록 |
| `GET` | `/experiments/{experiment_id}/runs` | 실험별 실행 목록 |
| `POST` | `/experiments/runs/compare` | 여러 실행 비교 |
| `GET` | `/experiments/models` | 등록된 모델 목록 |
| `GET` | `/experiments/models/{name}/versions` | 모델 버전 조회 |
| `POST` | `/experiments/models/{name}/versions/{version}/stage` | 모델 스테이지 전환 |

#### Airflow DAG (`/dags`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/dags/` | 전체 DAG 목록 |
| `POST` | `/dags/{dag_id}/trigger` | DAG 실행 트리거 |
| `GET` | `/dags/{dag_id}/graph` | DAG 태스크 그래프 조회 |
| `PATCH` | `/dags/{dag_id}/pause` | DAG 일시정지/재개 |
| `GET` | `/dags/{dag_id}/runs` | DAG 실행 목록 |

#### 리니지 (`/lineage`)

| 메서드 | 경로 | 설명 | 파라미터 |
|--------|------|------|---------|
| `GET` | `/lineage/` | 아티팩트 리니지 추적 | `artifact` |

### 실습: ML 실행 비교

1. http://localhost:8004/docs 열기
2. `POST /experiments/runs/compare` 찾기
3. 요청 본문:
   ```json
   {
     "run_ids": ["run-abc123", "run-def456", "run-ghi789"]
   }
   ```
4. 응답 (메트릭 나란히 비교):
   ```json
   [
     {
       "run_id": "run-abc123",
       "status": "FINISHED",
       "metrics": {"accuracy": 0.95, "f1_score": 0.93, "loss": 0.05},
       "params": {"learning_rate": "0.001", "epochs": "50"}
     },
     {
       "run_id": "run-def456",
       "status": "FINISHED",
       "metrics": {"accuracy": 0.97, "f1_score": 0.96, "loss": 0.03},
       "params": {"learning_rate": "0.0005", "epochs": "100"}
     }
   ]
   ```

### 실습: 모델을 프로덕션으로 승격

1. `POST /experiments/models/{name}/versions/{version}/stage` 찾기
2. 입력: `name` = `fraud-detector`, `version` = `3`
3. 요청 본문:
   ```json
   {
     "stage": "Production"
   }
   ```
4. 응답:
   ```json
   {
     "name": "fraud-detector",
     "version": "3",
     "current_stage": "Production",
     "status": "READY",
     "source": "s3://mlops-models/fraud-detector/v3"
   }
   ```

### 실습: Airflow DAG 트리거

1. `POST /dags/{dag_id}/trigger` 찾기
2. `dag_id` 입력: `ml-training-pipeline`
3. 요청 본문:
   ```json
   {
     "conf": {
       "model_name": "fraud-detector",
       "dataset_version": "2026-03-01",
       "hyperparams": {"lr": 0.001, "epochs": 100}
     }
   }
   ```
4. 응답:
   ```json
   {
     "dag_run_id": "manual__2026-03-19T10:30:00+00:00",
     "dag_id": "ml-training-pipeline",
     "state": "queued"
   }
   ```

---

## 8. 전체 데이터 흐름

### Swagger를 통한 전체 ML 워크플로우

전체 플랫폼을 통한 데이터 이동 경로:

```
                          ┌─────────────────────────────────────────────────┐
                          │                  SWAGGER UI                      │
                          └────────┬──────────┬──────────┬──────────┬───────┘
                                   │          │          │          │
                     ┌─────────────▼──┐  ┌────▼────┐  ┌─▼──────┐  ┌▼────────┐
                     │ API Gateway    │  │ MLOps   │  │ 파이프  │  │ 서빙     │
                     │ :8000          │  │ :8004   │  │ 라인   │  │ :8003    │
                     │                │  │         │  │ :8002  │  │          │
                     │ 인증 + 프록시   │  │ MLflow  │  │ Airbyte│  │ KServe   │
                     └────────────────┘  │ Airflow │  │ Prefect│  │ K8s CRDs │
                                         └────┬────┘  │ Spark  │  └────┬─────┘
                                              │       └───┬────┘       │
                                              │           │            │
                     ┌────────────────────────┼───────────┼────────────┼──────┐
                     │                Kubernetes 클러스터                       │
                     │                                                        │
                     │  ┌─────────┐  ┌────────┐  ┌────────┐  ┌────────────┐  │
                     │  │ MLflow  │  │Airflow │  │ Airbyte│  │ KServe     │  │
                     │  │ Server  │  │ 스케줄러│  │ Server │  │ Controller │  │
                     │  └─────────┘  └────────┘  └────────┘  └────────────┘  │
                     │                                                        │
                     │  ┌────────────┐  ┌──────┐  ┌───────┐  ┌───────────┐  │
                     │  │Prometheus  │  │ Loki │  │ Tempo │  │Alertmanager│  │
                     │  └────────────┘  └──────┘  └───────┘  └───────────┘  │
                     └────────────────────────────────────────────────────────┘
```

### 시나리오: 모델 학습, 평가, 배포

**1단계**: 데이터 파이프라인 트리거 (파이프라인 서비스)
```
POST http://localhost:8002/connections/{conn_id}/sync
-> Airbyte가 소스에서 데이터 웨어하우스로 데이터 동기화
```

**2단계**: 학습 DAG 트리거 (MLOps 서비스)
```
POST http://localhost:8004/dags/ml-training-pipeline/trigger
  {"conf": {"model_name": "fraud-detector", "dataset": "v3"}}
-> Airflow가 Spark/K8s에서 학습 오케스트레이션
```

**3단계**: 실험 실행 비교 (MLOps 서비스)
```
POST http://localhost:8004/experiments/runs/compare
  {"run_ids": ["run-1", "run-2", "run-3"]}
-> MLflow가 비교용 메트릭 반환
```

**4단계**: 최적 모델 승격 (MLOps 서비스)
```
POST http://localhost:8004/experiments/models/fraud-detector/versions/3/stage
  {"stage": "Production"}
-> MLflow 모델 레지스트리 업데이트
```

**5단계**: Kubernetes에 모델 배포 (서빙 서비스)
```
POST http://localhost:8003/inference-services/
  {"name": "fraud-detector", "framework": "sklearn", "model_uri": "s3://..."}
-> KServe가 InferenceService CRD 생성
```

**6단계**: 카나리 배포 (서빙 서비스)
```
PATCH http://localhost:8003/inference-services/fraud-detector/traffic
  {"canary_percent": 10}
-> 새 버전에 10% 트래픽, 안정 버전에 90% 트래픽
```

**7단계**: 성능 모니터링 (모니터링 서비스)
```
GET http://localhost:8001/metrics/query_range
  ?query=sum(rate(revision_request_count{service_name="fraud-detector"}[5m]))
  &start=1709000000&end=1709100000&step=60s
-> Prometheus가 시간대별 RPS 반환
```

**8단계**: 모델 서빙 메트릭 확인 (서빙 서비스)
```
GET http://localhost:8003/inference-services/fraud-detector/metrics
-> {"rps": 142.5, "latency_p99_ms": 23.7}
```

---

## 9. Swagger로 데이터 흐름 테스트

### 9.1 Swagger "Try it out" 사용법

모든 Swagger UI 엔드포인트에는 **Try it out** 버튼이 있습니다:

1. 서비스의 `/docs` URL로 이동
2. 테스트할 엔드포인트 펼치기
3. **Try it out** 클릭
4. 파라미터와 요청 본문 입력
5. **Execute** 클릭
6. 응답 본문, 상태 코드, 헤더 확인

### 9.2 Swagger에서 인증

**API Gateway** (포트 8000)의 엔드포인트는 JWT 인증이 필요합니다:

1. 먼저 `POST /api/v1/auth/login`을 호출하여 토큰 획득
2. **Authorize** 버튼 클릭 (상단 자물쇠 아이콘)
3. 입력: `Bearer <your-access-token>`
4. **Authorize** -> **Close** 클릭
5. 이후 모든 요청에 Authorization 헤더 자동 포함

> 개별 서비스(8001-8004)는 직접 접근 시 인증이 필요하지 않습니다.

### 9.3 Swagger에서 curl 명령어

Swagger는 모든 요청에 대해 동등한 `curl` 명령어를 보여줍니다:

```bash
# Swagger UI에서 표시되는 예시
curl -X 'GET' \
  'http://localhost:8001/metrics/query_range?query=up&start=1709000000&end=1709100000&step=60s' \
  -H 'accept: application/json'
```

### 9.4 SSE 스트림 테스트

SSE (Server-Sent Events) 엔드포인트는 Swagger에서 완전히 테스트할 수 없습니다. curl을 사용하세요:

```bash
# 메트릭 스트림 (Prometheus)
curl -N http://localhost:8001/metrics/stream?query=up&interval=5

# K8s 이벤트 스트림
curl -N http://localhost:8001/k8s/events?namespace=default
```

### 9.5 WebSocket 테스트

WebSocket 엔드포인트 (`/logs/stream`)는 Swagger에서 지원되지 않습니다. websocat 또는 JS 클라이언트를 사용하세요:

```bash
# websocat 사용
websocat ws://localhost:8001/logs/stream?query='{namespace="default"}'

# Python 사용
import asyncio, websockets, json

async def tail_logs():
    async with websockets.connect(
        "ws://localhost:8001/logs/stream?query={namespace=\"default\"}"
    ) as ws:
        while True:
            data = json.loads(await ws.recv())
            print(data)

asyncio.run(tail_logs())
```

---

## 10. Swagger 커스터마이징

### 10.1 현재 설정

각 서비스는 FastAPI 기본 설정을 사용합니다:

```python
# 각 main.py에서
app = FastAPI(
    title="MLOps Platform API Gateway",   # Swagger 헤더에 표시
    version=settings.version,              # API 버전으로 표시
    lifespan=lifespan,
)
```

### 10.2 설명 및 태그 추가

Swagger 문서를 개선하려면 `main.py`를 수정합니다:

```python
app = FastAPI(
    title="MLOps Platform API Gateway",
    version=settings.version,
    description="MLOps Platform의 통합 진입점. "
                "인증, 속도 제한, 리버스 프록시를 처리합니다.",
    lifespan=lifespan,
    docs_url="/docs",          # 기본값
    redoc_url="/redoc",        # 기본값
    openapi_url="/openapi.json",  # 기본값
)
```

### 10.3 프로덕션에서 문서 비활성화

프로덕션 배포 시 Swagger UI를 비활성화합니다:

```python
import os

docs_url = "/docs" if os.getenv("ENVIRONMENT") != "production" else None
redoc_url = "/redoc" if os.getenv("ENVIRONMENT") != "production" else None

app = FastAPI(
    title="API Gateway",
    docs_url=docs_url,
    redoc_url=redoc_url,
)
```

### 10.4 OpenAPI 스펙 내보내기

Postman, Insomnia 또는 코드 생성기에서 사용할 스펙을 다운로드합니다:

```bash
# OpenAPI 스펙 저장
curl http://localhost:8000/openapi.json > gateway-openapi.json
curl http://localhost:8001/openapi.json > monitoring-openapi.json
curl http://localhost:8002/openapi.json > pipeline-openapi.json
curl http://localhost:8003/openapi.json > serving-openapi.json
curl http://localhost:8004/openapi.json > mlops-openapi.json
```

Postman으로 가져오기:
1. Postman 열기 -> Import -> File
2. `.json` 파일 선택
3. 모든 엔드포인트가 컬렉션으로 표시됨
