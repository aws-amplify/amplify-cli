export type FullPath = string;
export type FileContent = string | null;
export interface AmplifyTestVolume {
  toJSON(): Record<string, string | null>;
  setAll(volume: Record<FullPath, FileContent>): void;
  setFile(fullPath: FullPath, content: FileContent): void;
}
