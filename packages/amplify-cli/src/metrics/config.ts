import fs from 'fs-extra';

export class Config {
  isMetricsEnabled: boolean = false;
  isMetricsPrompted: boolean = false;
  static get(path: string): Config {
    if (fs.existsSync(path)) {
      const text = fs.readFileSync(path, 'utf-8');
      return Object.assign(new Config(), JSON.parse(text));
    }

    return Object.assign(new Config(), {});
  }

  write(path: string) {
    if (!fs.existsSync(path)) {
      fs.createFileSync(path);
    }
    fs.writeFileSync(path, JSON.stringify(this));
  }
}
