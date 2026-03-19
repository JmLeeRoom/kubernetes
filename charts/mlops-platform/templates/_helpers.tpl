{{/*
Expand the name of the chart.
*/}}
{{- define "mlops-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mlops-platform.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: mlops-platform
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Selector labels for a service component
Usage: {{ include "mlops-platform.selectorLabels" (dict "component" "api-gateway") }}
*/}}
{{- define "mlops-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/instance: {{ .component }}
{{- end }}

{{/*
Image reference for a component
Usage: {{ include "mlops-platform.image" (dict "svc" .Values.apiGateway "global" .Values.global "name" "api-gateway") }}
*/}}
{{- define "mlops-platform.image" -}}
{{- $repo := .svc.image.repository | default (printf "%s/%s" .global.imageRegistry .name) -}}
{{- $tag := .svc.image.tag | default .global.imageTag -}}
{{- printf "%s:%s" $repo $tag -}}
{{- end }}

{{/*
Image pull secrets
*/}}
{{- define "mlops-platform.imagePullSecrets" -}}
{{- range .Values.global.imagePullSecrets }}
- name: {{ . }}
{{- end }}
{{- end }}
