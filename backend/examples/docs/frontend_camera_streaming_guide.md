# Frontend Camera Streaming Guide

This guide describes the frontend flow for starting a live stream, polling for
the playback URL, and refreshing device state with the current backend API.

## Endpoints Used

- `POST /api/v1/cameras/{camera_id}/stream`
- `GET /api/v1/cameras/{camera_id}/stream-url`
- `POST /api/v1/cameras/check-devices`
- `GET /api/v1/cameras/inventory`
- `GET /api/v1/cameras/{camera_id}`

All endpoints are mounted under `/api/v1` and require the authenticated user
session already used by the rest of the app.

## Streaming Flow

### 1. User starts live view

When the user presses the "Watch live" or equivalent action for a camera:

1. Call `POST /api/v1/cameras/{camera_id}/stream`.
2. Do not send a request body.
3. If the backend returns `202`, the stream-start command was queued for the
   camera's assigned device.

Example success response:

```json
{
  "command_id": "9b39d3ba-c997-4864-89bf-df6f4d3f1885",
  "camera_id": "cam-1",
  "device_id": "device-1",
  "command_type": "start_stream",
  "status": "queued"
}
```

The backend internally uses a fixed duration of `300` seconds. The frontend
does not send or manage duration.

### 2. Poll for the playback URL

After the `POST /stream` request succeeds, start polling:

- `GET /api/v1/cameras/{camera_id}/stream-url`
- interval: every `1 second`
- stop polling on the first `200 OK`

Example success response:

```json
{
  "camera_id": "cam-1",
  "stream_url": "https://example.com/live.m3u8",
  "expires_at": "2026-03-20T10:05:00+00:00"
}
```

When the first `200` arrives:

1. Take `stream_url`.
2. Set it as the HLS player source.
3. Stop the 1-second polling loop.
4. Start playback.

### 3. Refresh the playback URL before it expires

`stream_url` is temporary. The response includes `expires_at`.

Frontend behavior:

- keep the current `expires_at` in memory
- request a new `GET /stream-url` before expiry
- recommended refresh window: `30-60` seconds before `expires_at`

This refresh does not require another `POST /stream` as long as the device is
already streaming and the user is still watching.

## Recommended Polling Rules

### `POST /stream`

Treat these results as follows:

- `202`: success, start the 1-second `/stream-url` polling loop
- `404 camera_not_found`: stop, the user cannot access the camera
- `409 device_not_assigned`: stop, the camera has no assigned device
- `503 cameras_not_configured` or `503 devices_not_configured`: stop and show
  backend configuration error

### `GET /stream-url`

Treat these results as follows:

- `200`: success, use `stream_url` immediately
- `502 stream_playback_negotiation_failed`: retry after 1 second
- `404 camera_not_found`: stop
- `409 camera_stream_not_configured`: stop
- `503 cameras_not_configured` or `503 streaming_not_configured`: stop

The backend does not expose a separate "stream is still starting" response.
For the current API, the practical retry signal is `502
stream_playback_negotiation_failed` during startup.

## Device State Refresh Flow

`POST /api/v1/cameras/check-devices` is not a read endpoint. It queues
`get_camera_info` commands for devices visible to the current user.

Example response:

```json
{
  "queued": 4,
  "skipped_active": 1,
  "skipped_without_device": 2,
  "skipped_retired": 0
}
```

Important:

- this response does not contain device online/offline state
- it only tells the frontend how many checks were queued or skipped
- to display device state, the frontend must fetch camera data again

### Recommended device-state loop

For inventory pages or camera-detail pages:

1. Call `POST /api/v1/cameras/check-devices` on page load.
2. Re-fetch `GET /api/v1/cameras/inventory` or `GET /api/v1/cameras/{camera_id}`
   shortly after, or let the normal page refresh cycle pick up the updated
   state.
3. Repeat `POST /api/v1/cameras/check-devices` on a regular interval.

Recommended interval:

- every `30 seconds` for normal monitoring screens

If the page is showing a single actively viewed camera, the frontend can use a
shorter interval, but `30 seconds` is the safe default.

## Suggested Frontend State Machine

For each live-view attempt:

1. `idle`
2. `starting_stream`
3. `waiting_for_stream_url`
4. `playing`
5. `refreshing_stream_url`
6. `error`

Suggested transitions:

- `idle -> starting_stream` after user click
- `starting_stream -> waiting_for_stream_url` after `POST /stream` returns `202`
- `waiting_for_stream_url -> playing` after first `GET /stream-url` returns `200`
- `playing -> refreshing_stream_url` before `expires_at`
- `refreshing_stream_url -> playing` after refreshed URL is received
- any non-retryable error -> `error`

## TypeScript-Style Pseudocode

```ts
async function startCameraLiveView(cameraId: string) {
  const startResponse = await api.post(`/api/v1/cameras/${cameraId}/stream`);

  if (startResponse.status !== 202) {
    throw new Error("stream_start_failed");
  }

  while (true) {
    try {
      const response = await api.get(`/api/v1/cameras/${cameraId}/stream-url`);

      if (response.status === 200) {
        player.load(response.data.stream_url);
        scheduleRefresh(cameraId, response.data.expires_at);
        return;
      }
    } catch (error) {
      if (error.response?.data?.error?.code !== "stream_playback_negotiation_failed") {
        throw error;
      }
    }

    await sleep(1000);
  }
}

async function refreshVisibleDeviceStates() {
  await api.post("/api/v1/cameras/check-devices");
  await reloadCameraInventory();
}
```

## Implementation Notes

- Deduplicate live-view clicks on the same camera while a start attempt is in
  progress.
- Cancel the 1-second `/stream-url` polling loop when the user closes the
  player or navigates away.
- Cancel any scheduled URL refresh when the player is destroyed.
- If the page already has fresh camera data, keep using
  `GET /api/v1/cameras/{camera_id}` for single-camera status refresh and
  `GET /api/v1/cameras/inventory` for list pages.
- Do not interpret `queued > 0` from `/check-devices` as "device is online".
  It only means the check command was queued successfully.
