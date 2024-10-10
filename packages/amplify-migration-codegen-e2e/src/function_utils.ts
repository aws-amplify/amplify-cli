import path from 'node:path';
import * as fs from 'fs-extra';

export function copyFunctionFile(projRoot: string, gen1FunctionName: string) {
  const sourcePath = path.join(
    projRoot,
    '.amplify',
    'migration',
    'amplify',
    'backend',
    'function',
    gen1FunctionName.split('-')[0],
    'src',
    'index.js',
  );
  const destinationPath = path.join(projRoot, 'amplify', 'function', gen1FunctionName.split('-')[0], 'handler.ts');
  const content = fs.readFileSync(sourcePath, 'utf8');

  // Replace the first occurrence of 'event' with 'event: any'
  const modifiedContent = content.replace(/(exports\.handler\s*=\s*async\s*\(\s*)event(\s*\))/, '$1event: any$2');

  fs.writeFileSync(destinationPath, modifiedContent, 'utf8');
}
