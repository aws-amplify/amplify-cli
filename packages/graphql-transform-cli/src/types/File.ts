import { CastingContext } from 'clime';
import * as Path from 'path';
import * as fs from 'fs';

export default class File {

    public static cast(path: string, context: CastingContext<File>): File {
        return new File(Path.resolve(context.cwd, path));
    }

    constructor(public path: string) { }

    public read(): Promise<string> {
        return new Promise((res, rej) => {
            fs.readFile(this.path, 'utf8', (err, contents) => {
                if (err) {
                    rej(err);
                }
                res(contents);
            });
        });
    }

    public readSync(): string {
        return fs.readFileSync(this.path, 'utf8')
    }

    public write(data: string): Promise<void> {
        return new Promise((res, rej) => {
            fs.writeFile(this.path, data, (err) => {
                if (err) {
                    rej(err);
                }
                res();
            });
        });
    }

    public writeSync(data: string): void {
        fs.writeFileSync(this.path, data);
    }
}
