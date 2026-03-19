# ADR-001: KServe as the Model Serving Layer

## Status

Accepted

## Context

The MLOps platform requires a Kubernetes-native solution for deploying, managing, and scaling machine learning inference services. Key requirements:

- **Multi-framework support**: TensorFlow, PyTorch, Scikit-learn, XGBoost, ONNX
- **Canary deployments**: Gradual traffic shifting between model versions
- **Auto-scaling**: Scale-to-zero and GPU-aware scaling
- **Declarative management**: CRD-based approach fitting our K8s-first architecture
- **Metrics and monitoring**: Integration with Prometheus for inference latency and throughput

Alternatives considered:
1. **Seldon Core** – Mature, but heavier operator footprint and more complex CRD schema
2. **BentoML** – Strong packaging, but less native K8s integration for traffic routing
3. **TensorFlow Serving / Triton** – Framework-specific, would need separate deployments per framework
4. **Custom Deployment + HPA** – Full control but significant engineering effort for traffic splitting and scale-to-zero

## Decision

We adopt **KServe (v0.12+)** as the model serving layer for the following reasons:

1. **InferenceService CRD** provides a single abstraction across all ML frameworks, simplifying our API surface to CRUD operations on a single resource type.
2. **Canary traffic routing** is a first-class feature, controlled via `spec.canaryTrafficPercent` in the CRD – directly exposed in our Traffic Split page.
3. **Scale-to-zero** with Knative (or KServe's built-in RawDeployment mode) reduces idle GPU costs.
4. **Prometheus annotations** are built in, enabling seamless integration with our Monitoring service.
5. The Kubernetes Python client can manage KServe CRDs via `CustomObjectsApi`, which our `serving_svc/clients/kserve.py` already implements.

## Consequences

### Positive
- Unified deployment model across frameworks
- No custom traffic splitting controller needed
- Auto-scaling out of the box
- Dashboard can expose deploy/rollback/traffic-split as simple REST operations

### Negative
- Dependency on either Knative Serving or Istio for the full feature set (RawDeployment mode reduces this)
- KServe version upgrades may change CRD schema – we pin to a specific API version (`v1beta1`)
- Requires ClusterRole with KServe CRD permissions (addressed in Helm RBAC template)

### Mitigations
- Pin `serving.kserve.io/v1beta1` in client code
- Helm chart includes KServe-specific RBAC rules
- Integration tests mock the `CustomObjectsApi` to avoid cluster dependency
