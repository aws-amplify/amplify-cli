import _ from 'lodash';
import path from 'path';

// Converts files to a map of file to destination filename
// removes .ejs from file extension and appends src to the path
// ['a.js.ejs', 'b.json'] => {'a.js.ejs': 'src/a.js', 'b.json': 'src/b.json'}
export function getDstMap(files: string[]): { [key: string]: string } {
  return files.reduce((acc, it) => _.assign(acc, { [it]: path.join('src', it.replace(/\.ejs$/, '')) }), {});
}
