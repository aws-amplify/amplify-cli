/**
 * Create an OSC 8 terminal hyperlink
 * Supported in iTerm2, Windows Terminal, GNOME Terminal, VS Code terminal
 * Unsupported terminals just display the text
 */
export function terminalLink(text: string, url: string): string {
  return `\x1b]8;;${url}\x07${text}\x1b]8;;\x07`;
}
