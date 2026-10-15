# Host runtime

Host fills in infrastructure that SDK users should not have to operate: chain indexing,
media ingest and recordings, content storage, remote gateway sessions, and sponsorship.
`packages/host` owns the shared wire types; `host` owns their server implementation.

## Source layout

| Path | Responsibility |
| --- | --- |
| `main.ts`, `server.ts`, `deps.ts` | Start transports, mount routes, construct shared state |
| `config/` | Environment, network and explicit deployment inputs |
| `features/aa/` | Sponsorship HTTP routes and one provider implementation per chain |
| `features/catalog/` | All discovery HTTP routes, chain readers, indexer, scheduler and page projections |
| `features/content/` | Blob/VOD HTTP routes, uploads, mandates and resolution records |
| `features/live/` | HTTP signaling, live WebSocket transport and live-byte state |
| `features/remote/` | HTTP/WS console transport, authentication, grants, sessions and relay |
| `features/media/` | Policy/session HTTP routes, manifests and evidence |
| `features/recordings/` | Recording HTTP routes, lifecycle and MP4 verification |
| `features/discovery/` | Similarity HTTP routes and index |
| `features/forum/`, `features/memory/`, `features/descriptor/` | Complete small HTTP features; no separate service hop |
| `http/` | Shared response/error helpers, limits, CORS and headers |
| `database/` | Kysely connection, schema and the single baseline migration |
| `storage/` | External S3-compatible object store |

A feature owns its HTTP workflow, state and any scheduler or WebSocket transport. There are
no parallel `api`, `services` or `infrastructure` trees to trace. `database/` and `storage/`
remain shared because multiple features use those external resources. The runtime baseline is shared with tests; source filenames alone do not establish that a module is unused.

There is no repository layer, embedded bundler, Kora process, Walrus client, or LiveKit stub.
All discovery pages use the same database projection. The squashed baseline adopts known earlier migration records transactionally, preserving existing data.

## Infrastructure boundaries

EVM bundler calls go to the configured `bundlerUrl`; optional hosted paymaster calls go to
`paymasterUrl`. The Host preserves provider gas estimates. Host does not hold an EVM paymaster signing key.
Public sponsorship requires Host authorization. Provider gas policy and budget are separate
from Host authentication.

Media policy sessions are metadata, not live broadcasts. Their manifests contain no playback
endpoints until a real provider supplies them. Simulcast is unavailable; a key cannot enable an
unimplemented provider. Live video uses `/live` HTTP/WS paths. Archived playback uses `/recordings`.
Manifests and cache receipts remain explicitly unsigned, and do not prove storage by themselves.

## Development and verification

Use Node 22. `dev.sh` starts the app on port 3001 and Host on port 8788, targeting
Arc mainnet without deploying, minting or sending automatic transactions.
Configure dedicated Turso and S3-compatible storage credentials in the mainnet checkout.
No populated database or credentials are inherited from another edition.

Run the Host workspace's check, test, and build scripts. These offline checks do not
prove that the public deployment or a real-money lifecycle is ready.

## State ownership

`createHostRouteDeps` is the single constructor for mutable Host state. Async boot checks storage,
prepares sponsors and records migrations before starting catalog scheduling. Tests and production
use the same live ring and direct-announcement callback for indexed live status. Routes declare
only the dependencies they read. Session draft and summary share one keyed record; callers cannot
mutate stored manifests by holding an input reference. Catalog projection resets and the cached
process-wide AA deployment snapshot were removed.

AA configuration belongs to `config/aa.ts`, with deployment facts loaded by
`config/deployment.ts`. `features/aa/evm.ts` forwards provider requests.
The only supported production chain is Arc mainnet (5042). Its deployed contract
snapshot is loaded from the contracts package. Sponsorship is unavailable unless
an upstream paymaster is configured and authorization permits it.
