import { useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { uploadData, list, remove, getUrl } from 'aws-amplify/storage';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { listNotes } from './graphql/queries';
import { createNote, deleteNote } from './graphql/mutations';
import '@aws-amplify/ui-react/styles.css';
import './App.css';

const client = generateClient({
  authMode: 'userPool',
});

interface Note {
  id: string;
  title: string;
  content?: string;
}

interface AuthenticatedAppProps {
  signOut?: (data?: { global?: boolean }) => void;
  notes: Note[];
  newNote: string;
  setNewNote: (value: string) => void;
  loading: boolean;
  fetchNotes: () => void;
  addNote: () => void;
  removeNote: (id: string) => void;
  files: string[];
  uploading: boolean;
  uploadFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  listFiles: () => void;
  deleteFile: (key: string) => void;
  thumbnails: { [key: string]: string };
}

function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});

  const fetchNotes = async () => {
    setLoading(true);
    try {
      console.log('Fetching notes...');
      const result = (await client.graphql({ query: listNotes })) as {
        data: {
          listNotes: {
            items: Note[];
          };
        };
      };
      console.log('Fetch result:', result);
      setNotes(result.data.listNotes.items);
    } catch (error) {
      console.error('Error fetching notes:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Error fetching notes: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    try {
      console.log('Creating note:', newNote);
      const result = await client.graphql({
        query: createNote,
        variables: {
          input: {
            title: newNote,
            content: 'Created from React app',
          },
        },
      });
      console.log('Create result:', result);
      setNewNote('');
      await fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Error creating note: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeNote = async (id: string) => {
    try {
      await client.graphql({
        query: deleteNote,
        variables: { input: { id } },
      });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadData({
        key: `media/${Date.now()}-${file.name}`,
        data: file,
      }).result;
      console.log('Upload successful:', result);
      await listFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const listFiles = async () => {
    try {
      const result = await list({ prefix: 'media/' });
      const fileKeys = result.items.map((item) => item.key).filter((key) => !key.includes('/thumbnails/'));
      setFiles(fileKeys);

      // Get thumbnail info for each image file
      fileKeys.forEach((key) => {
        if (key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          getThumbnailInfo(key);
        }
      });
    } catch (error) {
      console.error('Error listing files:', error);
    }
  };

  const deleteFile = async (key: string) => {
    try {
      await remove({ key });
      await listFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getThumbnailInfo = async (fileKey: string) => {
    try {
      const thumbnailKey = fileKey.replace(/^(.+)\/([^/]+)$/, '$1/thumbnails/$2') + '.txt';
      const url = await getUrl({ key: thumbnailKey });
      const response = await fetch(url.url);
      const thumbnailInfo = await response.text();
      setThumbnails((prev) => ({ ...prev, [fileKey]: thumbnailInfo }));
    } catch (error) {
      console.log('No thumbnail info found for:', fileKey);
    }
  };

  return (
    <Authenticator socialProviders={['facebook', 'google']}>
      {({ signOut }) => (
        <AuthenticatedApp
          signOut={signOut}
          notes={notes}
          newNote={newNote}
          setNewNote={setNewNote}
          loading={loading}
          fetchNotes={fetchNotes}
          addNote={addNote}
          removeNote={removeNote}
          files={files}
          uploading={uploading}
          uploadFile={uploadFile}
          listFiles={listFiles}
          deleteFile={deleteFile}
          thumbnails={thumbnails}
        />
      )}
    </Authenticator>
  );
}

function AuthenticatedApp({
  signOut,
  notes,
  newNote,
  setNewNote,
  loading,
  fetchNotes,
  addNote,
  removeNote,
  files,
  uploading,
  uploadFile,
  listFiles,
  deleteFile,
  thumbnails,
}: AuthenticatedAppProps) {
  const [displayName, setDisplayName] = useState<string>('User');

  useEffect(() => {
    const timer = setTimeout(async () => {
      fetchNotes();
      listFiles();

      // Fetch user attributes to get real name
      try {
        const attributes = await fetchUserAttributes();
        const name = attributes.name || attributes.given_name || attributes.email || 'User';
        setDisplayName(name);
      } catch (error) {
        console.log('Could not fetch user attributes:', error);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '30px',
      borderRadius: '12px',
      marginBottom: '30px',
      textAlign: 'center' as const,
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '16px',
      width: '300px',
      marginRight: '12px',
    },
    button: {
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      marginRight: '8px',
    },
    deleteButton: {
      padding: '6px 12px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
    },
    todoItem: {
      background: '#f8fafc',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fileItem: {
      background: '#f0f9ff',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fileInput: {
      padding: '12px',
      border: '2px dashed #3b82f6',
      borderRadius: '8px',
      backgroundColor: '#f8fafc',
      width: '100%',
      textAlign: 'center' as const,
      cursor: 'pointer',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem' }}>📁 Personal Media Vault</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Welcome back, {displayName}! 👋</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>📝 Quick Notes</h3>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a quick note..."
              style={styles.input}
            />
            <button
              onClick={addNote}
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? '⏳' : '➕'} Add
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notes.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No notes yet. Add one above! ✨</p>
            ) : (
              notes.map((note: Note) => (
                <div key={note.id} style={styles.todoItem}>
                  <div>
                    <strong style={{ color: '#1f2937' }}>{note.title}</strong>
                    {note.content && <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>{note.content}</p>}
                  </div>
                  <button onClick={() => removeNote(note.id)} style={styles.deleteButton}>
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>🎬 Media Files</h3>
          <div style={{ marginBottom: '20px' }}>
            <input type="file" onChange={uploadFile} disabled={uploading} accept="image/*,video/*,audio/*" style={styles.fileInput} />
            {uploading && <div style={{ textAlign: 'center', marginTop: '12px', color: '#3b82f6' }}>⏳ Uploading your file...</div>}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {files.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No files uploaded yet. Drop one above! 📤</p>
            ) : (
              files.map((fileKey) => (
                <div key={fileKey} style={styles.fileItem}>
                  <div>
                    <span style={{ color: '#1f2937', fontWeight: '500' }}>
                      📄 {fileKey.replace('media/', '').substring(0, 30)}
                      {fileKey.replace('media/', '').length > 30 ? '...' : ''}
                    </span>
                    {fileKey.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        {thumbnails[fileKey] ? (
                          <span style={{ color: '#10b981' }}>✅ Thumbnail processed</span>
                        ) : (
                          <span style={{ color: '#f59e0b' }}>⏳ Processing thumbnail...</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteFile(fileKey)} style={styles.deleteButton}>
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <button
          onClick={() => signOut?.()}
          style={{
            ...styles.button,
            backgroundColor: '#6b7280',
          }}
        >
          👋 Sign Out
        </button>
      </div>
    </div>
  );
}

export default App;
