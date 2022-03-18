const { existsSync, mkdirSync, createWriteStream } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);
const os = require('os');
const axios = require('axios');
const tar = require('tar');
const rimraf = require('rimraf');

const error = msg => {
  console.error(msg);
  process.exit(1);
};

class Binary {
  constructor(name, url) {
    let errors = [];
    if (typeof url !== 'string') {
      errors.push('url must be a string');
    } else {
      try {
        new URL(url);
      } catch (e) {
        errors.push(e);
      }
    }
    if (name && typeof name !== 'string') {
      errors.push('name must be a string');
    }

    if (!name) {
      errors.push('You must specify the name of your binary');
    }
    if (errors.length > 0) {
      let errorMsg = 'One or more of the parameters you passed to the Binary constructor are invalid:\n';
      errors.forEach(error => {
        errorMsg += error;
      });
      errorMsg += '\n\nCorrect usage: new Binary("my-binary", "https://example.com/binary/download.tar.gz")';
      error(errorMsg);
    }
    this.url = url;
    this.name = name;
    this.installDirectory = join(os.homedir(), '.amplify', 'bin');

    if (!existsSync(this.installDirectory)) {
      mkdirSync(this.installDirectory, { recursive: true });
    }

    this.binaryPath = join(this.installDirectory, this.name);
  }

  install() {
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

  run() {
    if (!existsSync(this.binaryPath)) {
      error(`You must install ${this.name} before you can run it ${this.binaryPath}`);
    }

    const [, , ...args] = process.argv;

    const options = { cwd: process.cwd(), stdio: 'inherit' };

    const result = spawnSync(this.binaryPath, args, options);

    if (result.error) {
      error(result.error);
    }

    process.exit(result.status);
  }
}

module.exports.Binary = Binary;
