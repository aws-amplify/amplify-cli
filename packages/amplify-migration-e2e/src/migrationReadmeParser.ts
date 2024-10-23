function extractContent(readmeContent: string, startRegex: string, endRegex: string) {
  const pattern = new RegExp(`${startRegex}([\\s\\S]*?)${endRegex}`, 'i');
  const match = readmeContent.match(pattern);

  if (match && match[1]) {
    return match[1].trim();
  }
  throw new Error('README file parsing failed to get the stack refactor commands');
}

function extractCommands(readmeContent: string) {
  const pattern = /```([\s\S]*?)```/g;
  const matches = readmeContent.matchAll(pattern);
  const commands = [];

  for (const match of matches) {
    if (match[1]) {
      commands.push(match[1].trim());
    }
  }
  if (commands.length === 0) {
    throw new Error('README file parsing failed to get the stack refactor commands');
  }
  return commands;
}

export function getCommandsFromReadme(readmeContent: string) {
  const step1Content = extractContent(readmeContent, '### STEP 1', '#### Rollback step');
  const step2Content = extractContent(readmeContent, '### STEP 2', '#### Rollback step');
  const step3Content = extractContent(readmeContent, '### STEP 3', '#### Rollback step');
  const step1Commands = extractCommands(step1Content);
  const step2commands = extractCommands(step2Content);
  const step3Commands = extractCommands(step3Content);
  return { step1Commands, step2commands, step3Commands };
}
