# Viewport adoption (Phase 2a)

In-process client that emulates a UniFi Protect Viewport device: connects
mTLS-WebSocket to the NVR's device server (ds, :7442), adopts keyless with an
admin-minted token, stays Online. Pure units: protocol/identity/token/backoff.
Wire: connection (ws) + index (AdoptionClient). Spike variables: WS path, adopt
sequence, Viewport model string — resolved live via scripts/dev/adopt-test.js.
