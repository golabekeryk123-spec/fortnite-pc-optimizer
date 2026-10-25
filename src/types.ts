export interface ScanResult {
  cpu: { name: string; cores: number; threads: number };
  gpu: { name: string; vramGB: number | null; driver: string | null };
  memory: { totalGB: number; speedMHz: number | null; slotsUsed: number | null };
  os: { name: string; version: string; build: string };
  board: { manufacturer: string; model: string; bios: string };
  disks: Array<{ name: string; totalGB: number; freeGB: number }>;
  network: Array<{ name: string; speedMbps: number | null }>;
  scannedAt: string;
  isAdmin?: boolean;
}
export interface CleanupPreview {
  items: Array<{ id: string; label: string; description: string; bytes: number; files: number }>;
  scannedAt: string;
}
export interface TweakState {
  applied: Record<string, { appliedAt: string; title?: string; recoveryPending?: boolean }>;
  restorePoints: Array<{ id: string; createdAt: string; description: string }>;
  lastRestorePoint?: string | null;
}
export interface MutationResult {
  applied: string[];
  failed: Array<{ id: string; message: string }>;
  state: TweakState;
}
export interface NativeApi {
  diagnoseNetwork(): Promise<NetworkDiagnostics>;
  scanner(): Promise<ScanResult>;
  getTweakState(): Promise<TweakState>;
  applyTweaks(ids: string[]): Promise<MutationResult>;
  undoTweaks(ids: string[]): Promise<MutationResult>;
  createRestorePoint(): Promise<TweakState>;
  previewCleanup(): Promise<CleanupPreview>;
  runCleanup(ids: string[]): Promise<{ bytes: number; files: number; failedFiles: number }>;
  minimize(): void;
  close(): void;
}
export interface NetworkMeasurement {
  host: string;
  sent: number;
  received: number;
  averageMs: number | null;
  minMs: number | null;
  maxMs: number | null;
  jitterMs: number | null;
}
export interface NetworkDiagnostics {
  gateway: NetworkMeasurement | null;
  internet: NetworkMeasurement;
  measuredAt: string;
}
declare global { interface Window { veyra?: NativeApi } }
