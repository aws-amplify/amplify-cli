import path from 'path';

export function shimSourceFiles(): Array<string> {
  return [
    'InvocationShim/InvocationShim.csproj.ejs',
    'InvocationShim/MockContext.cs.ejs',
    'InvocationShim/MockLogger.cs',
    'InvocationShim/Program.cs.ejs',
  ];
}

export function shimMappings(): { [name: string]: string } {
  return {
    'InvocationShim/InvocationShim.csproj.ejs': path.join('src', 'InvocationShim/InvocationShim.csproj'),
    'InvocationShim/MockContext.cs.ejs': path.join('src', 'InvocationShim/MockContext.cs'),
    'InvocationShim/MockLogger.cs': path.join('src', 'InvocationShim/MockLogger.cs'),
    'InvocationShim/Program.cs.ejs': path.join('src', 'InvocationShim/Program.cs'),
  };
}
