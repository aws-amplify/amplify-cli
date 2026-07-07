/* eslint-disable no-bitwise */
/* eslint-disable spellcheck/spell-checker */
/**
 * This file is copied from https://github.com/max-mapper/extract-zip
 * and turned off creating symlinks on the machine where archive is extracted
 */
const { createWriteStream, promises: fs } = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const yauzl = require('yauzl');
const { getAmplifyLogger } = require('@aws-amplify/amplify-cli-logger');

const openZip = promisify(yauzl.open);
const pipeline = promisify(stream.pipeline);

class Extractor {
  constructor(zipPath, opts) {
    this.zipPath = zipPath;
    this.opts = opts;
  }

  async extract() {
    this.zipfile = await openZip(this.zipPath, { lazyEntries: true });
    this.canceled = false;

    return new Promise((resolve, reject) => {
      this.zipfile.on('error', (err) => {
        this.canceled = true;
        reject(err);
      });
      this.zipfile.readEntry();

      this.zipfile.on('close', () => {
        if (!this.canceled) {
          resolve();
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.zipfile.on('entry', async (entry) => {
        if (this.canceled) {
          return;
        }

        if (entry.fileName.startsWith('__MACOSX/')) {
          this.zipfile.readEntry();
          return;
        }

        if (this.opts.skipEntryPrefixes && Array.isArray(this.opts.skipEntryPrefixes) && this.opts.skipEntryPrefixes.length > 0) {
          for (const skipEntriesPrefix of this.opts.skipEntryPrefixes) {
            if (entry.fileName.startsWith(skipEntriesPrefix)) {
              this.zipfile.readEntry();
              return;
            }
          }
        }

        const destDir = path.dirname(path.join(this.opts.dir, entry.fileName));

        try {
          await fs.mkdir(destDir, { recursive: true });

          const canonicalDestDir = await fs.realpath(destDir);
          const relativeDestDir = path.relative(this.opts.dir, canonicalDestDir);

          if (relativeDestDir.split(path.sep).includes('..')) {
            throw new Error(`Out of bound path "${canonicalDestDir}" found while processing file ${entry.fileName}`);
          }

          await this.extractEntry(entry);
          this.zipfile.readEntry();
        } catch (err) {
          this.canceled = true;
          this.zipfile.close();
          reject(err);
        }
      });
    });
  }

  async extractEntry(entry) {
    /* istanbul ignore if */
    if (this.canceled) {
      return;
    }

    if (this.opts.onEntry) {
      this.opts.onEntry(entry, this.zipfile);
    }

    const dest = path.join(this.opts.dir, entry.fileName);

    // convert external file attr int into a fs stat mode int
    const mode = (entry.externalFileAttributes >> 16) & 0xffff;
    // check if it's a symlink or dir (using stat mode constants)
    const IFMT = 61440;
    const IFDIR = 16384;
    const IFLNK = 40960;
    const symlink = (mode & IFMT) === IFLNK;
    let isDir = (mode & IFMT) === IFDIR;

    // Failsafe, borrowed from jsZip
    if (!isDir && entry.fileName.endsWith('/')) {
      isDir = true;
    }

    // check for windows weird way of specifying a directory
    // https://github.com/maxogden/extract-zip/issues/13#issuecomment-154494566
    const madeBy = entry.versionMadeBy >> 8;
    if (!isDir) isDir = madeBy === 0 && entry.externalFileAttributes === 16;

    const procMode = this.getExtractedMode(mode, isDir) & 0o777;

    // always ensure folders are created
    const destDir = isDir ? dest : path.dirname(dest);

    const mkdirOptions = { recursive: true };
    if (isDir) {
      mkdirOptions.mode = procMode;
    }
    await fs.mkdir(destDir, mkdirOptions);
    if (isDir) return;

    if (symlink) {
      getAmplifyLogger().logError({ message: 'Found symlinks in the zipped directory. These symlinks will not be extracted' });
      return;
    }
    const readStream = await promisify(this.zipfile.openReadStream.bind(this.zipfile))(entry);
    await pipeline(readStream, createWriteStream(dest, { mode: procMode }));
  }

  getExtractedMode(entryMode, isDir) {
    let mode = entryMode;
    // Set defaults, if necessary
    if (mode === 0) {
      if (isDir) {
        if (this.opts.defaultDirMode) {
          mode = parseInt(this.opts.defaultDirMode, 10);
        }

        if (!mode) {
          mode = 0o755;
        }
      } else {
        if (this.opts.defaultFileMode) {
          mode = parseInt(this.opts.defaultFileMode, 10);
        }

        if (!mode) {
          mode = 0o644;
        }
      }
    }

    return mode;
  }
}

module.exports = async function (zipPath, opts) {
  if (!path.isAbsolute(opts.dir)) {
    throw new Error('Target directory is expected to be absolute');
  }

  await fs.mkdir(opts.dir, { recursive: true });
  opts.dir = await fs.realpath(opts.dir);
  return new Extractor(zipPath, opts).extract();
};
