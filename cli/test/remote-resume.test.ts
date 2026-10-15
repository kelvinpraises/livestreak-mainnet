import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { acquireSessionLock, loadSessions, markRevoked, saveSessions, upsertSession, type StoredSession } from "../src/gateway/session/store.js";
import { restoreSessionRecord } from "../src/gateway/session/resume.js";
import { SessionRegistry } from "../src/gateway/session/registry.js";
import { createRelay } from "../src/gateway/remote/relay.js";

const stored = (): StoredSession => ({ sessionId: "resume01", scopes: ["bridge:action:fund"], holder: "remote",
  createdAtMs: Date.now() - 100, expiresAt: Date.now() + 60_000, spentUSDC: "400", spendCapUSDC: "1000",
  revoked: false, runId: "remote-resume01", contextDigest: "context", passwordVerifier: "verifier" });

describe("explicit session resume", () => {
  it("preserves identity, scopes, absolute expiry, run and cap; denies unsafe restoration", () => {
    const s = stored(); const r = restoreSessionRecord(s, "context");
    expect(r.sessionId).toBe(s.sessionId); expect(r.scopes).toEqual(s.scopes);
    expect(r.expiresAt).toBe(s.expiresAt); expect(r.spentUSDC).toBe(400n);
    const registry = new SessionRegistry(); registry.restore(r);
    expect(registry.authorize(r.sessionId, { scope: "bridge:action", action: "fund", args: { deposit: "601" } }).ok).toBe(false);
    expect(() => restoreSessionRecord(s, "other-wallet-or-settings")).toThrow(/context/);
    expect(() => restoreSessionRecord({ ...s, revoked: true }, "context")).toThrow(/revoked/);
    expect(() => restoreSessionRecord({ ...s, expiresAt: Date.now() - 1 }, "context")).toThrow(/expired/);
    expect(() => restoreSessionRecord(undefined, "context")).toThrow(/missing or corrupt/);
  });

  it("atomically writes private metadata, retains revocation, quarantines corrupt JSON and excludes duplicate owners", async () => {
    const dir = await mkdtemp(join(tmpdir(), "flow08-store-")); const path = join(dir, "sessions.json");
    try {
      const s = stored(); await saveSessions(path, [s]);
      expect((await stat(path)).mode & 0o777).toBe(0o600);
      const release = await acquireSessionLock(path, s.sessionId);
      await expect(acquireSessionLock(path, s.sessionId)).rejects.toThrow(/already running/);
      await release(); const releaseAgain = await acquireSessionLock(path, s.sessionId); await releaseAgain();
      await Promise.all([upsertSession(path, { ...s, spentUSDC: "600" }), markRevoked(path, s.sessionId)]);
      expect((await loadSessions(path))[0]?.revoked).toBe(true);
      await upsertSession(path, s); expect((await loadSessions(path))[0]?.revoked).toBe(true);
      await writeFile(path, '{broken'); expect(await loadSessions(path)).toEqual([]);
      const backups = (await readdir(dir)).filter(f => f.includes('.corrupt-'));
      expect(backups).toHaveLength(1); expect(await readFile(join(dir, backups[0]!), "utf8")).toBe('{broken');
    } finally { await rm(dir, { recursive: true, force: true }); }
  });

  it("reserves and persists spend before dispatch, including ambiguous failures and concurrent calls", async () => {
    const registry = new SessionRegistry(); const s = registry.restore(restoreSessionRecord(stored(), "context"));
    let persisted = 0n; let calls = 0;
    const relay = createRelay({ registry, beforeDispatch: async () => { persisted = s.spentUSDC; }, dispatch: async () => {
      calls++; expect(persisted).toBe(1000n); throw new Error("lost receipt");
    } });
    const frame = { type: "call" as const, callId: "first", sessionId: s.sessionId, envelope: { scope: "bridge:action" as const, action: "fund", args: { deposit: "600" } } };
    const results = await Promise.all([relay.handleCall(frame), relay.handleCall({ ...frame, callId: "second" })]);
    expect(calls).toBe(1); expect(s.spentUSDC).toBe(1000n); expect(results.every(r => !r.ok)).toBe(true);
    const dispatch = vi.fn(async () => ({}));
    const blocked = createRelay({ registry: new SessionRegistry(), dispatch });
    await blocked.handleCall(frame); expect(dispatch).not.toHaveBeenCalled();
  });
  it("mainnet startup never wipes sessions or automatically moves collateral", async () => {
    const script = await readFile(new URL("../../dev.sh", import.meta.url), "utf8");
    expect(script).not.toMatch(/\brm\b|clean_slate|mint\(|depositTo|anvil_setBalance/);
    expect(script).toContain("npm run dev --workspace=host");
    expect(script).toContain("npm run dev --workspace=app");
  });
});
