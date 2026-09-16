/** Copyright (C) 2025 Robert Lindley. Licensed under GPL-3.0. */

import type { BackstageServerOptions } from './backstage.js';

/** Minimal running application lifecycle required by the process entrypoint. */
export interface CliApplication {
  stop(reason?: string): Promise<void>;
}

/** Dependencies that isolate process integration from the testable CLI lifecycle. */
export interface CliRuntime {
  env: Readonly<NodeJS.ProcessEnv>;
  start(options?: Readonly<BackstageServerOptions>): Promise<CliApplication>;
  registerSignal(signal: NodeJS.Signals, handler: (signal: NodeJS.Signals) => void): void;
}
