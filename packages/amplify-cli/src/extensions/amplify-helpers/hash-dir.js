import { hashElement } from 'folder-hash';

// Creates a hash of the context of a directory, excluding any directories in the exclude array
// dir: string
// exclude: string[]
// returns: string
async function hashDir(dir, exclude) {
  // generating hash, ignoring node_modules as this can take long time to hash
  // the content inside node_modules change only when content of package-lock.json changes
  const { hash: folderHash } = await hashElement(dir, {
    folders: { exclude: exclude },
  });
  return Buffer.from(folderHash)
    .toString('hex')
    .substr(0, 20);
}

module.exports = {
  hashDir,
};
