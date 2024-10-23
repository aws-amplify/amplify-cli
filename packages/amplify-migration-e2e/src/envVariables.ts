type EnvVariableAction = 'SET' | 'DELETE';

export function toggleEnvVariable(name: string, option: EnvVariableAction, value?: string) {
  if (option === 'SET') {
    process.env[name] = value;
  } else if (option === 'DELETE') {
    delete process.env[name];
  }
}
