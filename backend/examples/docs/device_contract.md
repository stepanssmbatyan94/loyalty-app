# Device Commands and Message Contracts

This document describes the device-facing contracts implemented by the backend
today. It is intentionally backend-owned: every shape below was verified
against the current code in `app/modules/devices/`, `app/modules/ingest/`, and
their tests.

Historical context:

- The original edge-facing reference lives outside the repo as
  `/Users/arshavirhunanyan/Downloads/minolta-iot-api-reference-v0.0.9.pdf`.
- The markdown copy at
  `/Users/arshavirhunanyan/projects/minolta/docs/minolta-iot-api-reference-v0.0.9.md`
  is useful background, but it is not the source of truth for the backend.
- This file is the source of truth for the contracts the backend currently
  accepts, publishes, and persists.

## Scope

This file covers four contract layers:

1. Backend HTTP endpoints that queue device commands.
2. Outbound device-wire payloads published to MQTT or AWS IoT Core.
3. Inbound device command response payloads consumed from MQTT or SQS.
4. Inbound normalized device event payloads accepted by the ingest module.

## Current Supported Command Types

The backend currently accepts exactly these internal command types:

- `restart_device`
- `restart_tracker`
- `get_camera_info`
- `start_stream`
- `start_recording`

Persisted command statuses are:

- `queued`
- `dispatched`
- `acknowledged`
- `completed`
- `failed`
- `timed_out`

Notes:

- `timed_out` is a valid persisted status but is not produced by the current
  inbound response consumers.
- Unsupported command types are rejected at the application boundary with
  `400 unsupported_command_type`.

## HTTP Contracts

All routes below are mounted under `/api/v1` and require an authenticated user.

### Queue arbitrary device command

`POST /api/v1/cameras/{camera_id}/device-commands`

Request body:

```json
{
  "command_type": "restart_device",
  "payload": {}
}
```

Request schema:

- `command_type`: required string
- `payload`: optional object, defaults to `{}`

Success response: `202 Accepted`

```json
{
  "command_id": "2d7474d0-95a2-4e71-9041-131a7d8a8f4f",
  "camera_id": "cam-1",
  "device_id": "device-1",
  "command_type": "restart_device",
  "status": "queued"
}
```

Possible API error codes:

- `401 invalid_token` or other auth-layer errors
- `403` auth/provisioning errors
- `422` request validation error
- `400 unsupported_command_type`
- `404 camera_not_found`
- `409 device_not_assigned`
- `503 cameras_not_configured`
- `503 devices_not_configured`

### Start stream

`POST /api/v1/cameras/{camera_id}/stream`

Request body: none

Internal behavior:

- queues the `start_stream` device command
- uses a fixed internal duration of `300` seconds

Success response: `202 Accepted`

```json
{
  "command_id": "9b39d3ba-c997-4864-89bf-df6f4d3f1885",
  "camera_id": "cam-1",
  "device_id": "device-1",
  "command_type": "start_stream",
  "status": "queued"
}
```

Possible API error codes:

- `401 invalid_token` or other auth-layer errors
- `403` auth/provisioning errors
- `422` request validation error
- `404 camera_not_found`
- `409 device_not_assigned`
- `503 cameras_not_configured`
- `503 devices_not_configured`

This route is a validated convenience wrapper around the same internal
`start_stream` command type that can also be queued through the generic
`/device-commands` endpoint.

### Queue device checks for the authenticated user

`POST /api/v1/cameras/check-devices`

Request body: none

Behavior:

- loads the authenticated user's visible cameras
- skips cameras without assigned devices
- skips devices already marked `retired`
- skips devices that already have an active `get_camera_info` command
- queues `get_camera_info` for the remaining devices

Success response: `202 Accepted`

```json
{
  "queued": 4,
  "skipped_active": 1,
  "skipped_without_device": 2,
  "skipped_retired": 0
}
```

Response fields:

- `queued`: number of `get_camera_info` commands queued by this request
- `skipped_active`: number of devices skipped because an active
  `get_camera_info` command already exists
- `skipped_without_device`: number of visible cameras with no assigned device
- `skipped_retired`: number of assigned devices skipped because device status
  is `retired`

Important behavior:

- this route does not return device status values
- it only triggers device checks
- clients must re-fetch `/api/v1/cameras/inventory` or
  `/api/v1/cameras/{camera_id}` to read the updated status after responses are
  processed

Possible API error codes:

- `401 invalid_token` or other auth-layer errors
- `403` auth/provisioning errors
- `503 cameras_not_configured`
- `503 devices_not_configured`

## Dispatch Transports

The backend can publish the same wire contract through two transports:

- AWS IoT data-plane publish via `AwsIotHttpDispatcher`
- Direct MQTT publish via `MqttDeviceCommandDispatcher`

Both dispatchers publish to the same topic shape:

`<topic_prefix>/<provider_ref>/cmd`

Current default topic prefix: `minolta`

Example topic:

`minolta/minolta_01/cmd`

## Outbound Device-Wire Contract

### Mapping from backend command type to wire command

| Backend `command_type` | Wire `cmd` | Wire payload rule |
|---|---|---|
| `restart_device` | `restart_device` | Generic payload with `_meta` envelope |
| `restart_tracker` | `restart_tracker` | Generic payload with `_meta` envelope |
| `get_camera_info` | `sysinfo` | Exact payload `{"cmd":"sysinfo"}` |
| `start_stream` | `stream` | Exact payload `{"cmd":"stream","duration":120}` |
| `start_recording` | `stream` | Exact payload `{"cmd":"stream","duration":<requested_duration>}` when `duration` is a positive integer; otherwise falls back to `120` |

Important behavior:

- `start_stream` ignores any user-supplied payload fields and always emits
  exactly `{"cmd":"stream","duration":120}`.
- `start_recording` only uses `payload.duration`; other payload fields are not
  forwarded.
- `get_camera_info` emits no metadata envelope today; it publishes only the
  exact `sysinfo` payload.
- For generic commands, the backend constructs the payload as
  `{"cmd": <wire_command>, **payload, "_meta": {...}}`. That means a caller
  can currently override the default wire `cmd` by sending `payload.cmd`.
  `_meta` cannot be overridden because it is written last.

### Generic outbound command payload

For non-stream, non-sysinfo commands, the backend publishes this shape:

```json
{
  "cmd": "restart_device",
  "...payload_fields": "...",
  "_meta": {
    "command_id": "2d7474d0-95a2-4e71-9041-131a7d8a8f4f",
    "camera_id": "cam-1",
    "device_id": "device-1",
    "provider": "aws_iot",
    "provider_ref": "minolta_01",
    "requested_by_user_id": "user-1",
    "requested_at": "2026-03-20T10:15:00+00:00"
  }
}
```

`_meta` fields currently included by the backend:

- `command_id`
- `camera_id`
- `device_id`
- `provider`
- `provider_ref`
- `requested_by_user_id`
- `requested_at`

### Concrete outbound examples

`get_camera_info`

```json
{
  "cmd": "sysinfo"
}
```

`start_stream`

```json
{
  "cmd": "stream",
  "duration": 120
}
```

`start_recording` with `duration=900`

```json
{
  "cmd": "stream",
  "duration": 900
}
```

`restart_device`

```json
{
  "cmd": "restart_device",
  "reason": "manual",
  "_meta": {
    "command_id": "2d7474d0-95a2-4e71-9041-131a7d8a8f4f",
    "camera_id": "cam-1",
    "device_id": "device-1",
    "provider": "aws_iot",
    "provider_ref": "minolta_01",
    "requested_by_user_id": "user-1",
    "requested_at": "2026-03-20T10:15:00+00:00"
  }
}
```

## Inbound Device Command Response Contracts

The backend currently supports two response shapes:

1. A canonical explicit envelope with `command_id` and normalized status.
2. A compatibility path for device-native `sysinfo` and `stream` responses
   that do not include `command_id`.

Responses are consumed from:

- MQTT topics: `<topic_prefix>/<provider_ref>/cmd/response`
- SQS messages forwarded from an AWS IoT Core rule on `minolta/+/cmd/response`

### Canonical explicit response envelope

Preferred shape:

```json
{
  "command_id": "2d7474d0-95a2-4e71-9041-131a7d8a8f4f",
  "status": "completed",
  "provider": "aws_iot",
  "provider_ref": "minolta_01",
  "timestamp": "2026-03-20T10:16:00Z",
  "payload": {
    "info": "ok"
  },
  "failure_code": null,
  "failure_message": null
}
```

Fields:

- `command_id`: required string
- `status`: required string; only `acknowledged`, `completed`, and `failed`
  are acted on by the consumers
- `provider`: optional in transport payload; defaults to `aws_iot` when absent
- `provider_ref`: optional if it can be derived from the MQTT/SQS topic
- `timestamp`: optional; defaults to current UTC time when absent
- `payload`: optional object; non-object values are discarded and treated as `{}`
- `failure_code`: optional, used when `status == "failed"`
- `failure_message`: optional, used when `status == "failed"`

Current consumer behavior:

- `acknowledged` publishes `DeviceCommandAcknowledged`
- `completed` publishes `DeviceCommandCompleted`
- `failed` publishes `DeviceCommandFailed`
- any other explicit `status` value is ignored after normalization

### Compatibility response: `sysinfo`

Accepted shape:

```json
{
  "cmd": "sysinfo",
  "data": {
    "serial": "c4:a5:59:d3:01:c7",
    "hostname": "Minolta_MD08-EMR"
  }
}
```

Normalization rules:

- The backend resolves `provider_ref` from either `provider_ref` in the body or
  the topic `minolta/<provider_ref>/cmd/response`.
- The backend looks up the latest active command for:
  - `provider`
  - `provider_ref`
  - `command_type = get_camera_info`
- If no active matching command exists, the message is ignored.
- If a match exists, the backend emits a normalized completed event with this
  payload:

```json
{
  "available": true,
  "cmd": "sysinfo",
  "data": {
    "serial": "c4:a5:59:d3:01:c7",
    "hostname": "Minolta_MD08-EMR"
  }
}
```

Important current behavior:

- A successfully normalized `sysinfo` response always sets `payload.available`
  to `true`.
- There is no current compatibility path that maps a `sysinfo` response to
  `available = false`.

### Compatibility response: `stream`

Accepted shape:

```json
{
  "cmd": "stream",
  "status": "ok"
}
```

Normalization rules:

- The backend resolves `provider_ref` from the body or topic.
- It then searches for the latest active command in this order:
  1. `start_recording`
  2. `start_stream`
- If no active matching command exists, the message is ignored.

Status mapping:

| Device response | Normalized result |
|---|---|
| `{"cmd":"stream","status":"ok"}` | `completed` with payload `{"cmd":"stream","status":"ok"}` |
| `{"cmd":"stream","status":"busy"}` | `failed` with `failure_code = "busy"` and `failure_message = "stream command failed with status=busy"` |
| `{"cmd":"stream","status":"<anything-other-than-ok>"}` | `failed` with the raw body copied into `payload` |

## Topic and Provider Resolution Rules

The response consumers use these rules consistently:

- `provider` defaults to `aws_iot` when omitted
- `provider_ref` is resolved from:
  1. `body.provider_ref`, if present
  2. topic parsing of `minolta/<provider_ref>/cmd/response`
- `observed_at` is resolved from:
  1. `body.timestamp`, if present for device response consumers
  2. current UTC time otherwise

MQTT subscription behavior:

- when a command repository is available, the MQTT response consumer subscribes
  to exact response topics for known provider refs, for example:
  - `minolta/minolta_01/cmd/response`
  - `minolta/minolta_02/cmd/response`
- when no command repository is available, it falls back to:
  - `minolta/+/cmd/response`

## Inbound Generic Device Event Contract

Separately from command-response transport, the ingest module accepts normalized
device events as plain dictionaries and turns them into shared-kernel domain
events.

Accepted event types:

- `heartbeat`
- `status_changed`
- `command_acknowledged`
- `command_completed`
- `command_failed`

Base required fields for all ingest events:

- `event_type`
- `provider`
- `provider_ref`
- `occurred_at` or `observed_at`

Additional required fields by event type:

- `status_changed`: `status` either at top level or in `payload.status`
- `command_acknowledged`: `command_id` either at top level or in
  `payload.command_id`
- `command_completed`: `command_id` either at top level or in
  `payload.command_id`
- `command_failed`: `command_id` either at top level or in
  `payload.command_id`

Optional fields:

- `payload`: object, defaults to `{}`
- `raw_event_id`
- `failure_code`
- `failure_message`

Example heartbeat event:

```json
{
  "event_type": "heartbeat",
  "provider": "aws_iot",
  "provider_ref": "thing/front-gate",
  "occurred_at": "2026-03-18T10:00:00+00:00",
  "raw_event_id": "evt-1",
  "payload": {
    "signal": "ok"
  }
}
```

Example normalized command failure event:

```json
{
  "event_type": "command_failed",
  "provider": "aws_iot",
  "provider_ref": "thing/front-gate",
  "occurred_at": "2026-03-18T10:01:00+00:00",
  "command_id": "cmd-1",
  "failure_code": "TIMEOUT",
  "failure_message": "device did not respond",
  "payload": {}
}
```

## Persistence Semantics

Once the backend normalizes a device-originated message into an internal event,
the devices module persists and applies it as follows.

### Device event history

Every applied normalized event is written to device event history with:

- `device_id`
- `camera_id` when the device is assigned
- `event_type`
- `occurred_at`
- `payload`
- `raw_event_id`

### Device state updates

Applied events update device state like this:

- `device_heartbeat_received` -> device status becomes `online`
- `device_command_acknowledged` -> device status becomes `online`
- `device_command_completed` -> device status becomes `online`
- `device_command_failed` -> device status becomes `online`
- `device_status_changed` -> device status becomes the validated event status

### Command state updates

Applied command events update persisted command state like this:

- `device_command_acknowledged` -> command status `acknowledged`,
  `acknowledged_at = observed_at`
- `device_command_completed` -> command status `completed`,
  `completed_at = observed_at`
- `device_command_failed` -> command status `failed`,
  `completed_at = observed_at`, plus `failure_code` and `failure_message`

### Camera availability update from `get_camera_info`

When a persisted command is completed and its `command_type` is
`get_camera_info`, the backend also updates `cameras.status`:

- `payload.available == true` -> camera status becomes `online`
- `payload.available == false` -> camera status becomes `unavailable`
- missing or non-boolean `payload.available` -> camera status is left unchanged

Because the current `sysinfo` compatibility mapping always emits
`payload.available = true`, accepted `sysinfo` responses currently drive the
camera to `online`.

## Operational Notes

- If neither MQTT nor SQS response transport is configured, command responses
  are not processed after dispatch.
- If MQTT is configured, the backend prefers the MQTT response consumer.
- If MQTT is not configured but AWS IoT response SQS is configured, the backend
  uses the SQS response consumer.
- AWS IoT dispatch and raw MQTT dispatch publish the same device-wire payloads;
  only the transport differs.
