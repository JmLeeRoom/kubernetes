FROM python:3.11-slim AS builder

WORKDIR /app
RUN pip install --no-cache-dir uv

COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.11-slim AS runtime

RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin/uvicorn /usr/local/bin/uvicorn

COPY . .
RUN chown -R appuser:appuser /app
USER appuser

ARG SERVICE=monitoring_svc
ENV SERVICE=${SERVICE}

EXPOSE 8000
CMD uvicorn ${SERVICE}.main:app --host 0.0.0.0 --port 8000 --workers 2
