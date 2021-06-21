import * as path from 'path';

export const packageName = 'amplify-python-function-runtime-provider';
export const relativeShimPath = path.join('shim', 'shim.py');
export const layerPythonPipFile = path.join(__dirname, '..', 'resources', 'Pipfile');
