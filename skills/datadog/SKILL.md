---
name: datadog
description: Query metrics, manage monitors, post events, and interact with Datadog via the dogshell CLI.
metadata:
  displayName: Datadog
  icon: activity
  category: monitoring
  version: 1.0.0
  dependencies:
    cli: dog
    checkCommand: dog --version
    install:
      darwin:
        pip: datadog
      linux:
        pip: datadog
      windows:
        pip: datadog
  config:
    - name: DATADOG_API_KEY
      label: API Key
      type: secret
      required: true
      placeholder: Your Datadog API key
    - name: DATADOG_APP_KEY
      label: Application Key
      type: secret
      required: true
      placeholder: Your Datadog Application key
    - name: DATADOG_HOST
      label: Datadog Host
      type: string
      required: false
      placeholder: https://api.datadoghq.com
  auth:
    type: api-key
    envVars:
      - DATADOG_API_KEY
      - DATADOG_APP_KEY
---

# dogshell (Datadog CLI)

Use `dog` to interact with Datadog for metrics, monitors, events, dashboards, and more.

## Setup

Before using, set your Datadog API and Application keys:

```bash
export DATADOG_API_KEY="your_api_key"
export DATADOG_APP_KEY="your_app_key"
```

Or create `~/.dogrc`:

```ini
[Connection]
apikey = your_api_key
appkey = your_app_key
```

Secure the config file:

```bash
chmod 600 ~/.dogrc
```

## Common Commands

### Query Metrics

```bash
# Query metric data (last hour)
dog metric query --query "avg:system.cpu.user{*}" --start $(date -v-1H +%s) --end $(date +%s)

# Query with specific host filter
dog metric query --query "avg:system.memory.used{host:myserver}" --start $(date -v-1H +%s) --end $(date +%s)

# Query multiple metrics
dog metric query --query "avg:system.cpu.user{*},avg:system.cpu.system{*}" --start $(date -v-1H +%s) --end $(date +%s)
```

### Post Metrics

```bash
# Post a single metric
dog metric post my.custom.metric 42 --host myserver --tags env:prod,service:api

# Post metric with timestamp
dog metric post my.custom.metric 42 --timestamp $(date +%s)
```

### Events

```bash
# Post an event
dog event post "Deployment Complete" "Deployed version 1.2.3 to production" --tags env:prod,service:api

# Post event with priority
dog event post "Alert" "High memory usage detected" --priority normal --alert_type warning

# Query events (last 24 hours)
dog event query --start $(date -v-1d +%s) --end $(date +%s)

# Query events with tags
dog event query --start $(date -v-1d +%s) --end $(date +%s) --tags env:prod
```

### Monitors

```bash
# List all monitors
dog monitor list

# Get specific monitor
dog monitor show <monitor_id>

# Mute a monitor
dog monitor mute <monitor_id>

# Unmute a monitor
dog monitor unmute <monitor_id>

# Mute all monitors
dog monitor mute_all

# Create a metric monitor
dog monitor create "metric alert" "My Monitor" "avg(last_5m):avg:system.cpu.user{*} > 80" --message "CPU usage is high @slack-alerts"
```

### Service Checks

```bash
# Post a service check
dog service_check post my.service.check 0 --host myserver --tags env:prod
# Status: 0=OK, 1=WARNING, 2=CRITICAL, 3=UNKNOWN

# Post check with message
dog service_check post my.health.check 0 --message "All systems operational"
```

### Dashboards

```bash
# List all dashboards
dog dashboard list

# Get dashboard details
dog dashboard show <dashboard_id>
```

### Hosts

```bash
# Search hosts
dog host search --query "host:web*"

# Mute a host
dog host mute <hostname>

# Unmute a host
dog host unmute <hostname>
```

### Tags

```bash
# Get tags for a host
dog tag show <hostname>

# Add tags to a host
dog tag add <hostname> env:prod role:web

# Update tags for a host (replaces existing)
dog tag update <hostname> env:staging role:api

# Remove all tags from a host
dog tag detach <hostname>
```

### Downtimes

```bash
# Schedule a downtime
dog downtime schedule --scope "host:myserver" --start $(date +%s) --end $(date -v+1H +%s) --message "Maintenance window"

# List active downtimes
dog downtime list

# Cancel a downtime
dog downtime cancel <downtime_id>
```

## Environment Variables

| Variable          | Description                                         |
| ----------------- | --------------------------------------------------- |
| `DATADOG_API_KEY` | Your Datadog API key                                |
| `DATADOG_APP_KEY` | Your Datadog Application key                        |
| `DATADOG_HOST`    | API endpoint (default: `https://api.datadoghq.com`) |

For EU region, set:

```bash
export DATADOG_HOST="https://api.datadoghq.eu"
```

## Security Notes

- Never commit API keys to version control
- Use Application keys with minimal required permissions
- Store credentials in `~/.dogrc` with `chmod 600`
- Rotate keys periodically
- Use separate keys for different environments

## Useful Queries

### System Metrics

```bash
# CPU usage
dog metric query --query "avg:system.cpu.user{*} by {host}"

# Memory usage
dog metric query --query "avg:system.mem.used{*}/avg:system.mem.total{*}*100"

# Disk usage
dog metric query --query "avg:system.disk.in_use{*} by {device}"
```

### Application Metrics

```bash
# Request rate
dog metric query --query "sum:trace.http.request.hits{service:my-app}.as_rate()"

# Error rate
dog metric query --query "sum:trace.http.request.errors{service:my-app}/sum:trace.http.request.hits{service:my-app}*100"

# Latency (p95)
dog metric query --query "p95:trace.http.request.duration{service:my-app}"
```

## Alternative: datadog-ci

For CI/CD operations, use `datadog-ci`:

```bash
# Install
npm install -g @datadog/datadog-ci

# Upload sourcemaps
datadog-ci sourcemaps upload ./dist --service my-app --release-version 1.0.0

# Upload test results
datadog-ci junit upload --service my-app ./test-results/*.xml

# Trigger Synthetic tests
datadog-ci synthetics run-tests --public-id abc-123
```
