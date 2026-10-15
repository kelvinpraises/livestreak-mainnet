import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { parseArgs } from 'node:util';
import { createPublicClient, encodeFunctionData, formatEther, http, keccak256, parseGwei, type Address, type Hex } from 'viem';
import { ARC_MAINNET } from '../network.js';
import { createClients, ensureNickFactory, promoteDeployment, writeState, type ScopeResult } from './utils.js';
import { deployAA } from './scopes/01-aa.js';
import { deployStreaming } from './scopes/02-streaming.js';
import { deployProtocol } from './scopes/03-protocol.js';
import { deployWire } from './scopes/04-wire.js';

const { values } = parseArgs({ options: { estimate: { type: 'boolean' }, broadcast: { type: 'boolean' }, rpc: { type: 'string' } } });
if (values.estimate === values.broadcast) throw new Error('Choose exactly one: --estimate or --broadcast');
if (!process.env.DEPLOYER_PRIVATE_KEY) throw new Error('DEPLOYER_PRIVATE_KEY is required');
const rpc = values.rpc ?? 'https://rpc.blockdaemon.mainnet.arc.io';
const { publicClient: remote, walletClient: remoteWallet, account } = createClients(rpc, process.env.DEPLOYER_PRIVATE_KEY as Hex);
if (await remote.getChainId() !== ARC_MAINNET.chainId) throw new Error('RPC must be Arc mainnet (5042)');
const root = resolve(import.meta.dirname, '..');
const output = join(root, 'deploy/output');
mkdirSync(output, { recursive: true });
const planPath = join(output, 'arc-mainnet-plan.json');
const journalPath = join(output, 'arc-mainnet-transactions.json');
const cap = parseGwei('20.1');
const save = (p: string, value: unknown) => writeFileSync(p, JSON.stringify(value, null, 2) + '\n');
const loadAbi = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8')).abi;
const log = (value: unknown) => console.log(JSON.stringify(value));
const contractCode = async (address: Address) => { const code = await remote.getCode({ address }); if (!code || code === '0x') throw new Error(`Missing deployed code: ${address}`); };
const decimals = await remote.readContract({ address: ARC_MAINNET.collateral.address, abi: [{ type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view' }], functionName: 'decimals' });
if (decimals !== 6) throw new Error('Arc collateral must expose six decimals');

if (values.estimate) {
  if (existsSync(journalPath)) throw new Error('A broadcast journal already exists; resume it instead of replacing the plan');
  const block = await remote.getBlockNumber();
  const local = 'http://127.0.0.1:18564';
  const proc = spawn('anvil', ['--port', '18564', '--chain-id', '5042', '--hardfork', 'prague', '--silent', '--fork-url', rpc, '--fork-block-number', String(block)], { stdio: 'ignore' });
  const { publicClient, walletClient } = createClients(local, process.env.DEPLOYER_PRIVATE_KEY as Hex);
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (proc.exitCode !== null) throw new Error('Simulation node failed to start');
      try { ready = await publicClient.getChainId() === 5042; } catch { /* startup */ }
      if (ready) break;
      await new Promise(r => setTimeout(r, 200));
    }
    if (!ready) throw new Error('Simulation node not ready');
    const rows: { scope: string; to: Address; data: Hex; value: string; gas: string }[] = [];
    let scope = 'factory';
    const send = walletClient.sendTransaction.bind(walletClient);
    const wrapped = Object.assign({}, walletClient, {
      async sendTransaction(tx: any) {
        if ((tx.value ?? 0n) !== 0n) throw new Error('The deployment plan must not transfer collateral or fund a paymaster');
        const dump = await publicClient.request({ method: 'anvil_dumpState' as never, params: [] } as never) as Hex;
        let bytes = Buffer.from(dump.slice(2), 'hex');
        if (bytes[0] === 31 && bytes[1] === 139) bytes = gunzipSync(bytes);
        const state = JSON.parse(bytes.toString());
        const overrides = Object.fromEntries(Object.entries(state.accounts).map(([address, info]: any) => [address, { nonce: '0x' + info.nonce.toString(16), balance: info.balance, code: info.code, stateDiff: info.storage }]));
        const result = await remote.request({ method: 'eth_estimateGas', params: [{ from: account.address, to: tx.to, data: tx.data ?? '0x', value: '0x0' }, '0x' + block.toString(16), overrides] } as never) as Hex;
        const gas = BigInt(result);
        const localGas = await publicClient.estimateGas({ ...tx, account });
        const hash = await send({ ...tx, gas: localGas * 110n / 100n, maxFeePerGas: cap, maxPriorityFeePerGas: 0n } as never);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') throw new Error('Simulation reverted');
        rows.push({ scope, to: tx.to, data: tx.data ?? '0x', value: '0', gas: gas.toString() });
        log({ scope, transaction: rows.length, estimatedGas: String(gas) });
        return hash;
      },
      async writeContract(tx: any) {
        const { address, abi, functionName, args, ...rest } = tx;
        return this.sendTransaction({ ...rest, to: address, data: encodeFunctionData({ abi, functionName, args }) });
      }
    });
    await ensureNickFactory(publicClient, wrapped as never);
    const scopes: Record<string, ScopeResult> = {};
    for (const [name, fn] of [['aa', deployAA], ['streaming', deployStreaming], ['protocol', deployProtocol], ['wire', deployWire]] as const) {
      scope = name;
      scopes[name] = await fn(publicClient, wrapped as never, scopes, { chain: 'arc-mainnet', rpc: local, deployer: account.address });
      if (scopes[name].status !== 'completed') throw new Error(`${name}: ${scopes[name].error}`);
    }
    const gas = rows.reduce((n, r) => n + BigInt(r.gas), 0n);
    const maxCost = gas * 110n / 100n * cap;
    const balance = await remote.getBalance({ address: account.address });
    const plan = { chainId: 5042, deployer: account.address, rpc, estimatedAt: new Date().toISOString(), block: String(block), nonce: await remote.getTransactionCount({ address: account.address, blockTag: 'pending' }), maxFeePerGas: String(cap), estimatedGas: String(gas), maxCostUsdc: formatEther(maxCost), balanceUsdc: formatEther(balance), affordable: balance >= maxCost, rows, scopes };
    save(planPath, plan);
    log({ estimateComplete: true, transactions: rows.length, gas: String(gas), maxCostUsdc: plan.maxCostUsdc, balanceUsdc: plan.balanceUsdc, affordable: plan.affordable });
  } finally { proc.kill('SIGTERM'); }
} else {
  if (!existsSync(planPath)) throw new Error('Run --estimate before broadcasting');
  const plan = JSON.parse(readFileSync(planPath, 'utf8'));
  if (plan.chainId !== 5042 || plan.deployer.toLowerCase() !== account.address.toLowerCase()) throw new Error('Wrong deployment plan identity');
  if (!plan.affordable || BigInt(plan.maxFeePerGas) > cap) throw new Error('Plan exceeds funding or fee cap');
  const planDigest = keccak256(Buffer.from(JSON.stringify(plan)) as unknown as Hex);
  const journal = existsSync(journalPath) ? JSON.parse(readFileSync(journalPath, 'utf8')) : { chainId: 5042, deployer: account.address, planDigest, startedAt: new Date().toISOString(), transactions: [] };
  if (journal.planDigest !== planDigest) throw new Error('Plan changed after broadcast started');
  if (await remote.getGasPrice() > cap) throw new Error('Current network gas price exceeds the explicit 20.1 Gwei cap');
  for (let i = 0; i < plan.rows.length; i++) {
    const row = plan.rows[i];
    if (row.value !== '0') throw new Error('Unexpected native value in deployment plan');
    let entry = journal.transactions[i];
    if (!entry) {
      const gas = BigInt(row.gas) * 110n / 100n;
      if (await remote.getBalance({ address: account.address }) < gas * cap) throw new Error('Insufficient remaining balance before signing');
      // Save signed bytes/hash before broadcasting. A restart re-sends the identical nonce/transaction.
      const request = await remoteWallet.prepareTransactionRequest({ account, to: row.to, data: row.data, value: 0n, gas, nonce: plan.nonce + i, maxFeePerGas: cap, maxPriorityFeePerGas: 0n, chain: null });
      const serialized = await account.signTransaction(request as never);
      entry = { index: i, scope: row.scope, hash: keccak256(serialized), serialized };
      journal.transactions.push(entry); save(journalPath, journal);
    }
    let receipt;
    try { receipt = await remote.getTransactionReceipt({ hash: entry.hash }); } catch { /* not included */ }
    if (!receipt) {
      try { await remote.sendRawTransaction({ serializedTransaction: entry.serialized }); }
      catch (error) {
        // Already-known transactions are safe to wait on; other errors must not create a new nonce.
        if (!/already known|nonce too low/i.test(String(error))) throw error;
      }
      receipt = await remote.waitForTransactionReceipt({ hash: entry.hash, timeout: 180_000 });
    }
    entry.status = receipt.status;
    entry.gasUsed = String(receipt.gasUsed);
    entry.feeUsdc = formatEther(receipt.gasUsed * receipt.effectiveGasPrice);
    save(journalPath, journal);
    log({ confirmed: i + 1, total: plan.rows.length, hash: entry.hash, status: receipt.status, feeUsdc: entry.feeUsdc });
    if (receipt.status !== 'success') throw new Error('Mainnet transaction reverted; stopped without advancing');
  }
  const scopes = plan.scopes;
  for (const scope of Object.values(scopes) as ScopeResult[]) for (const address of Object.values(scope.contracts ?? {})) await contractCode(address as Address);
  const p = scopes.protocol.contracts;
  const w = scopes.wire.contracts;
  const protocolAbi = loadAbi('out/Protocol.sol/Protocol.json');
  for (const [fn, expected] of Object.entries({ marketRegistry: p.marketRegistry, vault: p.vault, marketDriver: w.marketDriverProxy, vaultDriver: w.vaultDriver, stewardRegistry: p.stewardRegistry, treasury: p.treasury, lvstToken: p.lvstToken, dripsStreaming: scopes.streaming.contracts.dripsProxy })) {
    const actual = await remote.readContract({ address: p.protocol, abi: protocolAbi, functionName: fn }) as string;
    if (actual.toLowerCase() !== String(expected).toLowerCase()) throw new Error(`Protocol wiring mismatch: ${fn}`);
  }
  for (const [address, artifact, getter] of [[p.treasury, 'Treasury', 'usdc'], [w.vaultDriver, 'VaultDriver', 'USDC'], [w.marketDriverProxy, 'MarketDriver', 'USDC']]) {
    const actual = await remote.readContract({ address: address as Address, abi: loadAbi(`out/${artifact}.sol/${artifact}.json`), functionName: getter as string }) as string;
    if (actual.toLowerCase() !== ARC_MAINNET.collateral.address.toLowerCase()) throw new Error(`Collateral mismatch: ${artifact}`);
  }
  const owner = await remote.readContract({ address: p.protocol, abi: protocolAbi, functionName: 'owner' }) as string;
  if (owner.toLowerCase() !== account.address.toLowerCase()) throw new Error('Unexpected protocol owner');
  writeState('arc-mainnet', { chain: 'arc-mainnet', chainId: 5042, rpc: ARC_MAINNET.rpcUrl, deployedAt: new Date().toISOString(), deployer: account.address, scopes });
  promoteDeployment('arc-mainnet');
  journal.status = 'verified'; journal.remainingUsdc = formatEther(await remote.getBalance({ address: account.address }));
  save(journalPath, journal);
  log({ status: 'verified', transactions: journal.transactions.length, remainingUsdc: journal.remainingUsdc, protocol: p.protocol, usdc: p.usdc });
}
