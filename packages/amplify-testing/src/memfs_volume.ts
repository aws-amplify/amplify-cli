import memfs from 'memfs';
import { AmplifyTestVolume, FileContent, FullPath } from './volume';
export class MemfsVolume implements AmplifyTestVolume {
  private vol: typeof memfs.vol;
  constructor() {
    this.vol = memfs.vol;
  }
  toJSON(): Record<string, string | null> {
    return this.vol.toJSON();
  }
  setAll(volume: Record<FullPath, FileContent>): void {
    this.vol.fromJSON(volume);
  }
  setFile(fullPath: FullPath, content: FileContent): void {
    if (content === null) {
      this.vol.unlinkSync(fullPath);
      return;
    }
    this.vol.writeFileSync(fullPath, content);
  }
}
