import path from 'node:path';
import * as fs from 'fs-extra';

export function copyFunctionFile(projRoot: string, category: string, gen1FunctionName: string) {
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
  const destinationPath = path.join(projRoot, 'amplify', category, gen1FunctionName.split('-')[0], 'handler.ts');
  let content = fs.readFileSync(sourcePath, 'utf8');

  // Replace the first occurrence of 'event' with 'event: any'
  content = content.replace(/(exports\.handler\s*=\s*async\s*\(\s*)event(\s*\))/, '$1event: any$2');
  content = content.replace(/(exports\.handler\s*=\s*async\s*\()(\w+)(\s*,\s*)(\w+)(\s*\))/, '$1$2: any$3$4: any$5');
  content = content.replace(/(const\s+moduleNames\s*=\s*process\.env\.MODULES)(.split\(','\);)/, '$1!$2');
  fs.writeFileSync(destinationPath, content, 'utf8');
}
