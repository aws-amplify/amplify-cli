import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import util from 'util';
import stream from 'stream';
import os from 'os';
import axios from 'axios';
import rimraf from 'rimraf';

const pipeline = util.promisify(stream.pipeline);

const error = (msg: string|Error): void => {
  console.error(msg);
  process.exit(1);
};

/**
 * Wraps logic to download and run binary
 */
export class Binary {
  public binaryPath: string;
  public url: string;
  public name: string;
  public installDirectory: string;
  constructor(name: string, url: string) {
    this.url = url;
    this.name = name;
    this.installDirectory = join(os.homedir(), '.amplify', 'bin');

    if (!existsSync(this.installDirectory)) {
      mkdirSync(this.installDirectory, { recursive: true });
    }

    this.binaryPath = join(this.installDirectory, this.name);
  }

  /**
   * Downloads the binary to the installDirectory
   */
  install(): Promise<void> {
    if (existsSync(this.installDirectory)) {
      rimraf.sync(this.installDirectory);
    }

    mkdirSync(this.installDirectory, { recursive: true });
    console.log(`Downloading release from ${this.url}`);
    return axios({ url: this.url, responseType: 'stream' })
      .then(async res => {
        await pipeline(
          res.data,
          createWriteStream(this.binaryPath, {
            mode: 0o755,
          }),
        );
      })
      .then(() => {
        console.log(`${this.name} has been installed!`);
      })
      .catch(e => {
        error(`Error fetching release: ${e.message}`);
      });
  }

  /**
   * Passes all arguments into the downloaded binary
   */
  run(): void {
    if (!existsSync(this.binaryPath)) {
      error(`You must install ${this.name} before you can run it ${this.binaryPath}`);
    }

    const [, , ...args] = process.argv;
    const result = spawnSync(this.binaryPath, args, { cwd: process.cwd(), stdio: 'inherit' });
    if (result.error) {
      error(result.error);
    }

    process.exit(result.status as number);
  }
}
