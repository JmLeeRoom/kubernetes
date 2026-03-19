#!/bin/bash
set -euo pipefail

# Bootstrap Keycloak realm and client for the MLOps Platform.
# Prerequisites:
#   - Keycloak is running and accessible
#   - KEYCLOAK_URL and KEYCLOAK_ADMIN_PASSWORD env vars are set
#   - jq and curl are installed

KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak.company.com}"
REALM="mlops-platform"
CLIENT_ID="mlops-dashboard"
DASHBOARD_URL="${DASHBOARD_URL:-https://dashboard.company.com}"

if [[ -z "${KEYCLOAK_ADMIN_PASSWORD:-}" ]]; then
  echo "ERROR: KEYCLOAK_ADMIN_PASSWORD is not set" >&2
  exit 1
fi

echo "==> Obtaining admin token from ${KEYCLOAK_URL} ..."
ADMIN_TOKEN=$(curl -sf -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -d "client_id=admin-cli&username=admin&password=${KEYCLOAK_ADMIN_PASSWORD}&grant_type=password" \
  | jq -r '.access_token')

if [[ -z "${ADMIN_TOKEN}" || "${ADMIN_TOKEN}" == "null" ]]; then
  echo "ERROR: Failed to obtain admin token" >&2
  exit 1
fi

echo "==> Creating realm '${REALM}' ..."
curl -sf -X POST "${KEYCLOAK_URL}/admin/realms" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "realm": "'"${REALM}"'",
    "enabled": true,
    "ssoSessionMaxLifespan": 86400,
    "accessTokenLifespan": 900,
    "refreshTokenMaxReuse": 0
  }' || echo "(realm may already exist)"

echo "==> Registering client '${CLIENT_ID}' ..."
curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'"${CLIENT_ID}"'",
    "protocol": "openid-connect",
    "publicClient": false,
    "redirectUris": ["'"${DASHBOARD_URL}"'/*"],
    "webOrigins": ["'"${DASHBOARD_URL}"'"],
    "standardFlowEnabled": true,
    "directAccessGrantsEnabled": false
  }' || echo "(client may already exist)"

echo "==> Creating groups ..."
for group in admin ml-engineer viewer; do
  curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/groups" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name": "'"${group}"'"}' || echo "(group '${group}' may already exist)"
done

echo "==> Adding 'groups' protocol mapper to client scope ..."
DEFAULT_SCOPE_ID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  | jq -r '.[] | select(.name == "'"${CLIENT_ID}"'-dedicated") | .id // empty')

if [[ -z "${DEFAULT_SCOPE_ID}" ]]; then
  DEFAULT_SCOPE_ID=$(curl -sf "${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    | jq -r '.[] | select(.name == "profile") | .id')
fi

if [[ -n "${DEFAULT_SCOPE_ID}" ]]; then
  curl -sf -X POST "${KEYCLOAK_URL}/admin/realms/${REALM}/client-scopes/${DEFAULT_SCOPE_ID}/protocol-mappers/models" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "groups",
      "protocol": "openid-connect",
      "protocolMapper": "oidc-group-membership-mapper",
      "config": {
        "full.path": "false",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "claim.name": "groups",
        "userinfo.token.claim": "true"
      }
    }' || echo "(mapper may already exist)"
fi

echo "==> Keycloak realm setup complete."
echo "    Realm:  ${REALM}"
echo "    Client: ${CLIENT_ID}"
echo "    Groups: admin, ml-engineer, viewer"
