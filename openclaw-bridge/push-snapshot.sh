#!/usr/bin/env bash
set -euo pipefail

: "${NETLIFY_INGEST_URL:?set NETLIFY_INGEST_URL}"
: "${GATEWAY_INGEST_TOKEN:?set GATEWAY_INGEST_TOKEN}"

ts="$(date +%s)"
host="$(hostname)"
uptime_s="$(cut -d. -f1 /proc/uptime)"
load1="$(awk '{print $1}' /proc/loadavg)"
mem_mb="$(awk '/MemAvailable/ {printf "%.0f",$2/1024}' /proc/meminfo)"

gateway_status="$(openclaw gateway status 2>&1 || true)"

# OPTIONAL: Uncomment if gateway runs as systemd service
# gateway_logs="$(journalctl -u openclaw-gateway --no-pager -n 80 2>/dev/null || true)"
gateway_logs=""

payload="$(jq -n \
  --arg host "$host" \
  --argjson ts "$ts" \
  --argjson uptimeSec "$uptime_s" \
  --argjson load1 "$load1" \
  --argjson memAvailMb "$mem_mb" \
  --arg gwStatus "$gateway_status" \
  --arg gwLogs "$gateway_logs" \
  '{
    host: $host,
    ts: $ts,
    hostStats: { uptimeSec: $uptimeSec, load1: $load1, memAvailMb: $memAvailMb },
    openclaw: {
      gatewayStatusText: $gwStatus,
      gatewayLogsText: $gwLogs
    }
  }'
)"

curl -fsS \
  -H "Authorization: Bearer ${GATEWAY_INGEST_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "$payload" \
  "$NETLIFY_INGEST_URL"
