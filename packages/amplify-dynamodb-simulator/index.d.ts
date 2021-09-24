import type { DynamoDB } from 'aws-sdk';

export interface EmulatorOptions {
  /** Port to bind the emulator to. If omitted will bind to the first available port in the ephemeral range. */
  port: number;
  /** default true */
  inMemory: boolean;
  /** If to use a single database file to use in the emulator. Should typically be left on. Default to false */
  sharedDb: boolean;
  /** Where to launch the database. Will automatically create this directory if missing. */
  dbPath: string;
  /** Maximum amount of time to wait for the dynamodb emulator to start listening on it's chosen port. Default 20 seconds */
  startTimeout: number;
  /** additional Java options */
  javaOpts: string;
}

export interface Emulator {
  readonly pid: string;
  readonly port: number;
  readonly url: string;
  terminate(): Promise<number>;
}

export function launch(
  givenOptions?: Partial<EmulatorOptions>,
  retry?: number,
  startTime?: number,
): Promise<Emulator>;
export function getClient(emu: Emulator, options?: DynamoDB.Types.ClientConfiguration): DynamoDB;
