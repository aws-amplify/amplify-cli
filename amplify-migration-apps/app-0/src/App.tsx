/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState, useRef, createContext, useContext } from 'react';

import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, downloadData, getProperties } from 'aws-amplify/storage';

import { Button, Heading, Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { type AuthUser } from 'aws-amplify/auth';
import { type UseAuthenticator } from '@aws-amplify/ui-react-core';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';

import { createTodo, updateTodo, deleteTodo } from './graphql/mutations';
import { listTodos } from './graphql/queries';
import { type CreateTodoInput, type Todo, type UpdateTodoInput } from './API';

const initialState: CreateTodoInput = { name: '', description: '', images: [] };
// Client for authenticated users (owner-based operations)
const authenticatedClient = generateClient({
  authMode: 'userPool',
});
// Client for public read access (works for both authenticated and unauthenticated users)
const publicClient = generateClient();

type AppProps = {
  signOut?: UseAuthenticator['signOut'];
  user?: AuthUser;
};

type FileProperties = {
  path?: string;
  contentType?: string;
  contentLength?: number;
  eTag?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
};

// Theme Context
type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// Function to get themed styles
const getThemedStyles = (theme: Theme) => {
  const isDark = theme === 'dark';

  return {
    container: {
      padding: 20,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: isDark ? '#1a1a1a' : '#f5f7fa',
      minHeight: '100vh',
      color: isDark ? '#e1e8ed' : '#2c3e50',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: 30,
      padding: 20,
      backgroundColor: isDark ? '#2d3748' : 'white',
      borderRadius: 12,
      boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
      maxWidth: 1200,
      margin: '0 auto 30px auto',
      color: isDark ? '#e1e8ed' : '#2c3e50',
    },
    mainContent: {
      maxWidth: 1200,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '400px 1fr',
      gap: 30,
      alignItems: 'start',
    },
    formCard: {
      backgroundColor: isDark ? '#2d3748' : 'white',
      padding: 24,
      borderRadius: 12,
      boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky' as const,
      top: 20,
    },
    todoListContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: 20,
    },
    todo: {
      backgroundColor: isDark ? '#2d3748' : 'white',
      padding: 20,
      borderRadius: 12,
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
      border: isDark ? '1px solid #4a5568' : '1px solid #e1e8ed',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      height: 'fit-content',
    },
    input: {
      border: isDark ? '2px solid #4a5568' : '2px solid #e1e8ed',
      backgroundColor: isDark ? '#1a202c' : '#f8f9fa',
      marginBottom: 16,
      padding: 12,
      fontSize: 16,
      borderRadius: 8,
      width: '100%',
      boxSizing: 'border-box' as const,
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      color: isDark ? '#e1e8ed' : '#2c3e50',
    },
    todoName: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: isDark ? '#e1e8ed' : '#2c3e50',
      marginBottom: 8,
      marginTop: 0,
    },
    todoDescription: {
      fontSize: 16,
      color: isDark ? '#a0aec0' : '#5a6c7d',
      marginBottom: 12,
      lineHeight: 1.5,
    },
    button: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      fontSize: 16,
      padding: '14px 24px',
      borderRadius: 8,
      cursor: 'pointer',
      fontWeight: '600' as const,
      width: '100%',
      transition: 'background-color 0.2s ease, transform 0.1s ease',
    },
    fileSelected: {
      fontSize: 14,
      color: '#28a745',
      marginBottom: 16,
      padding: 8,
      backgroundColor: isDark ? '#1a2e1a' : '#d4edda',
      borderRadius: 6,
      border: isDark ? '1px solid #2d5a2d' : '1px solid #c3e6cb',
    },
    imageFrame: {
      padding: 12,
      backgroundColor: isDark ? '#1a202c' : '#f8f9fa',
      borderRadius: 12,
      marginTop: 16,
      border: isDark ? '1px solid #4a5568' : '1px solid #e1e8ed',
      textAlign: 'center' as const,
    },
    buttonGroup: {
      display: 'flex',
      gap: 8,
      marginTop: 16,
      justifyContent: 'flex-end',
    },
    editButton: {
      backgroundColor: '#17a2b8',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      fontSize: 14,
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: '500' as const,
      transition: 'background-color 0.2s ease',
    },
    deleteButton: {
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      fontSize: 14,
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: '500' as const,
      transition: 'background-color 0.2s ease',
    },
    saveButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      fontSize: 14,
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: '600' as const,
      transition: 'background-color 0.2s ease',
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      fontSize: 14,
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: '500' as const,
      transition: 'background-color 0.2s ease',
    },
    readOnlyMessage: {
      textAlign: 'center' as const,
      marginBottom: 24,
      padding: 20,
      backgroundColor: isDark ? '#2a4a6b' : '#e3f2fd',
      borderRadius: 12,
      border: isDark ? '1px solid #4a90e2' : '1px solid #bbdefb',
      color: isDark ? '#87ceeb' : '#1565c0',
    },
    loginButton: {
      marginLeft: 12,
      padding: '10px 20px',
      fontSize: 14,
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: '600' as const,
    },
    emptyMessage: {
      textAlign: 'center' as const,
      color: isDark ? '#a0aec0' : '#6c757d',
      fontStyle: 'italic' as const,
      fontSize: 16,
      padding: 40,
      backgroundColor: isDark ? '#2d3748' : 'white',
      borderRadius: 12,
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
      gridColumn: '1 / -1',
    },
    formTitle: {
      fontSize: 24,
      fontWeight: '600' as const,
      color: isDark ? '#e1e8ed' : '#2c3e50',
      marginBottom: 20,
      textAlign: 'center' as const,
    },
    todoList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 20,
      maxWidth: 1200,
      margin: '0 auto',
    },
    themeToggle: {
      backgroundColor: isDark ? '#4a5568' : '#e2e8f0',
      color: isDark ? '#e1e8ed' : '#2d3748',
      border: 'none',
      padding: '8px 12px',
      fontSize: 18,
      borderRadius: 8,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    },
    editImageSection: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: isDark ? '#1a202c' : '#f8f9fa',
      borderRadius: 8,
      border: isDark ? '1px solid #4a5568' : '1px solid #e1e8ed',
    },
    editSectionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: isDark ? '#e1e8ed' : '#2c3e50',
      marginBottom: 8,
      marginTop: 0,
    },
    editImageList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
    },
    editImageItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 8,
      backgroundColor: isDark ? '#2d3748' : 'white',
      borderRadius: 6,
      border: isDark ? '1px solid #4a5568' : '1px solid #dee2e6',
    },
    editImageName: {
      fontSize: 14,
      color: isDark ? '#a0aec0' : '#495057',
      flex: 1,
    },
    removeImageButton: {
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '4px 8px',
      fontSize: 12,
      borderRadius: 4,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    },
    addImagesButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      fontSize: 14,
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: '500' as const,
      marginTop: 8,
      transition: 'background-color 0.2s ease',
    },
  };
};

// Component to display a single image from S3
const ImageDisplay: React.FC<{ imagePath: string }> = ({ imagePath }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [fileProperties, setFileProperties] = useState<FileProperties | null>(null);

  useEffect(() => {
    async function fetchImageUrl() {
      try {
        const url = await getUrl({ path: imagePath });
        setImageUrl(url.url.toString());
      } catch (error) {
        console.log('Error getting image URL:', error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchFileProperties() {
      try {
        const properties = await getProperties({ path: imagePath });
        setFileProperties(properties);
      } catch (error) {
        console.log('Error getting file properties:', error);
      }
    }

    if (imagePath) {
      fetchImageUrl();
      fetchFileProperties();
    }
  }, [imagePath]);

  async function handleDownload() {
    try {
      setDownloading(true);

      const downloadResult = await downloadData({
        path: imagePath,
      }).result;

      const blob = await downloadResult.body.blob();
      const url = URL.createObjectURL(blob);

      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = imagePath.split('/').pop() || 'image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.log('Error downloading image:', error);
    } finally {
      setDownloading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (loading) {
    return <p>Loading image...</p>;
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ position: 'relative', display: 'inline-block', width: '100%' }}
      >
        <img src={imageUrl} alt="Todo attachment" style={styles.image} />
        {showTooltip && fileProperties && (
          <div style={styles.tooltip}>
            <div style={styles.tooltipContent}>
              <p>
                <strong>📁 File:</strong> {imagePath.split('/').pop()}
              </p>
              <p>
                <strong>📏 Size:</strong> {formatFileSize(fileProperties.contentLength || 0)}
              </p>
              <p>
                <strong>🗂️ Type:</strong> {fileProperties.contentType || 'Unknown'}
              </p>
              <p>
                <strong>📅 Modified:</strong>{' '}
                {fileProperties.lastModified ? new Date(fileProperties.lastModified).toLocaleDateString() : 'Unknown'}
              </p>
              {fileProperties.metadata && Object.keys(fileProperties.metadata).length > 0 && (
                <p>
                  <strong>🏷️ Metadata:</strong> {JSON.stringify(fileProperties.metadata)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <button style={styles.downloadButton} onClick={handleDownload} disabled={downloading}>
        {downloading ? '⏳ Downloading...' : '📥 Download'}
      </button>
    </div>
  );
};

// Component to display multiple images with selector
const MultiImageDisplay: React.FC<{ imagePaths: string[] }> = ({ imagePaths }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!imagePaths || imagePaths.length === 0) {
    return null;
  }

  return (
    <div>
      <ImageDisplay imagePath={imagePaths[selectedImageIndex]} />
      {imagePaths.length > 1 && (
        <div style={styles.imageSelector}>
          <p style={styles.imageSelectorLabel}>📷 Images ({imagePaths.length}):</p>
          <div style={styles.imageThumbnails}>
            {imagePaths.map((path, index) => (
              <button
                key={path}
                onClick={() => setSelectedImageIndex(index)}
                style={{
                  ...styles.thumbnailButton,
                  ...(index === selectedImageIndex ? styles.thumbnailButtonActive : {}),
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Read-only App Component for unauthenticated users
const ReadOnlyApp: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const themedStyles = getThemedStyles(theme);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const todoData = await publicClient.graphql({
        query: listTodos,
      });
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log('error fetching todos');
    }
  }

  if (showLogin) {
    return <Authenticator>{({ signOut, user }) => <AuthenticatedApp signOut={signOut} user={user} />}</Authenticator>;
  }

  return (
    <div style={themedStyles.container}>
      <div style={themedStyles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading level={1} style={themedStyles.header}>
            Amplify Todos
          </Heading>
          <button style={themedStyles.themeToggle} onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <p style={themedStyles.readOnlyMessage}>
          You're viewing in read-only mode.
          <Button style={themedStyles.loginButton} onClick={() => setShowLogin(true)}>
            Sign in to create and edit todos
          </Button>
        </p>
      </div>

      <div style={themedStyles.todoList}>
        {todos.length === 0 ? (
          <p style={themedStyles.emptyMessage}>No todos yet. Sign in to create some!</p>
        ) : (
          todos.map((todo, index) => (
            <div key={todo.id ? todo.id : index} style={themedStyles.todo}>
              <p style={themedStyles.todoName}>{todo.name}</p>
              <p style={themedStyles.todoDescription}>{todo.description}</p>
              {todo.images && todo.images.length > 0 && (
                <div style={themedStyles.imageFrame}>
                  <MultiImageDisplay imagePaths={todo.images.filter((img): img is string => img !== null)} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Authenticated App Component
const AuthenticatedApp: React.FC<AppProps> = ({ signOut, user }) => {
  const [formState, setFormState] = useState<CreateTodoInput>(initialState);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<UpdateTodoInput>({ id: '', name: '', description: '', images: [] });
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();
  const themedStyles = getThemedStyles(theme);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const todoData = await publicClient.graphql({
        query: listTodos,
      });
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log(`error fetching todos: ${JSON.stringify(err)}`);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;

      setUploading(true);
      const imageKeys: string[] = [];

      // Upload all selected files
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExtension = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

          try {
            const result = await uploadData({
              path: `public/images/${fileName}`,
              data: file,
              options: {
                contentType: file.type,
              },
            }).result;

            imageKeys.push(result.path);
          } catch (uploadError) {
            console.log('Error uploading file:', uploadError);
            setUploading(false);
            return;
          }
        }
      }

      const todoInput = { ...formState, images: imageKeys };

      const result = await authenticatedClient.graphql({
        query: createTodo,
        variables: {
          input: todoInput,
        },
      });

      if (result.data?.createTodo) {
        setTodos([...todos, result.data.createTodo]);
      }

      setFormState(initialState);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploading(false);
    } catch (err) {
      console.log('error creating todo:', err);
      setUploading(false);
    }
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditFormState({
      id: todo.id,
      name: todo.name,
      description: todo.description || '',
      images: todo.images || [],
    });
  }

  function handleEditFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setEditSelectedFiles(files);
    }
  }

  async function addImagesToEdit() {
    if (editSelectedFiles.length === 0) return;

    setUploading(true);
    const newImageKeys: string[] = [];

    for (const file of editSelectedFiles) {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

      try {
        const result = await uploadData({
          path: `public/images/${fileName}`,
          data: file,
          options: {
            contentType: file.type,
          },
        }).result;

        newImageKeys.push(result.path);
      } catch (uploadError) {
        console.log('Error uploading file:', uploadError);
        setUploading(false);
        return;
      }
    }

    // Add new images to existing ones
    const updatedImages = [...(editFormState.images || []), ...newImageKeys];
    setEditFormState({ ...editFormState, images: updatedImages });
    setEditSelectedFiles([]);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
    setUploading(false);
  }

  function removeImageFromEdit(imageIndex: number) {
    const updatedImages = editFormState.images?.filter((_, index) => index !== imageIndex) || [];
    setEditFormState({ ...editFormState, images: updatedImages });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFormState({ id: '', name: '', description: '', images: [] });
    setEditSelectedFiles([]);
  }

  async function saveEdit() {
    try {
      if (!editFormState.name || !editFormState.description) return;

      setUploading(true);

      await authenticatedClient.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: editFormState.id,
            name: editFormState.name,
            description: editFormState.description,
            images: editFormState.images,
          },
        },
      });

      setTodos(todos.map((todo) => (todo.id === editFormState.id ? ({ ...todo, ...editFormState } as Todo) : todo)));

      setEditingId(null);
      setEditFormState({ id: '', name: '', description: '', images: [] });
      setEditSelectedFiles([]);
      setUploading(false);
    } catch (err) {
      console.log('error updating todo:', err);
      setUploading(false);
    }
  }

  async function removeTodo(id: string) {
    try {
      await authenticatedClient.graphql({
        query: deleteTodo,
        variables: {
          input: { id },
        },
      });

      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      console.log('error deleting todo:', err);
    }
  }

  return (
    <div style={themedStyles.container}>
      <div style={themedStyles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading level={1} style={themedStyles.header}>
            Hello {user?.username}
          </Heading>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={themedStyles.themeToggle} onClick={toggleTheme}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Button style={themedStyles.button} onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div style={themedStyles.mainContent}>
        <div style={themedStyles.formCard}>
          <h2 style={themedStyles.formTitle}>Create New Todo</h2>
          <input
            onChange={(event) => setFormState({ ...formState, name: event.target.value })}
            style={themedStyles.input}
            value={formState.name}
            placeholder="Todo name"
          />
          <input
            onChange={(event) => setFormState({ ...formState, description: event.target.value })}
            style={themedStyles.input}
            value={formState.description as string}
            placeholder="Description"
          />
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={themedStyles.input} />
          {selectedFiles.length > 0 && (
            <p style={themedStyles.fileSelected}>
              📎 Selected: {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
            </p>
          )}
          <button style={themedStyles.button} onClick={addTodo} disabled={uploading}>
            {uploading ? '⏳ Creating...' : '➕ Create Todo'}
          </button>
        </div>

        <div style={themedStyles.todoListContainer}>
          {todos.length === 0 ? (
            <p style={themedStyles.emptyMessage}>No todos yet. Create your first one!</p>
          ) : (
            todos.map((todo, index) => (
              <div key={todo.id ? todo.id : index} style={themedStyles.todo}>
                {editingId === todo.id ? (
                  <div>
                    <input
                      onChange={(event) => setEditFormState({ ...editFormState, name: event.target.value })}
                      style={themedStyles.input}
                      value={editFormState.name || ''}
                      placeholder="Todo name"
                    />
                    <input
                      onChange={(event) => setEditFormState({ ...editFormState, description: event.target.value })}
                      style={themedStyles.input}
                      value={editFormState.description || ''}
                      placeholder="Description"
                    />

                    {/* Current Images Management */}
                    {editFormState.images && editFormState.images.length > 0 && (
                      <div style={themedStyles.editImageSection}>
                        <p style={themedStyles.editSectionLabel}>📷 Current Images:</p>
                        <div style={themedStyles.editImageList}>
                          {editFormState.images
                            .filter((img): img is string => img !== null)
                            .map((imagePath, index) => (
                              <div key={imagePath} style={themedStyles.editImageItem}>
                                <span style={themedStyles.editImageName}>{imagePath.split('/').pop()}</span>
                                <button style={themedStyles.removeImageButton} onClick={() => removeImageFromEdit(index)} type="button">
                                  🗑️
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Images */}
                    <div style={themedStyles.editImageSection}>
                      <p style={themedStyles.editSectionLabel}>➕ Add Images:</p>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleEditFileSelect}
                        style={themedStyles.input}
                      />
                      {editSelectedFiles.length > 0 && (
                        <div>
                          <p style={themedStyles.fileSelected}>
                            📎 Selected: {editSelectedFiles.length} file{editSelectedFiles.length > 1 ? 's' : ''}
                          </p>
                          <button style={themedStyles.addImagesButton} onClick={addImagesToEdit} disabled={uploading} type="button">
                            {uploading ? '⏳ Adding...' : '📤 Add Images'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={themedStyles.buttonGroup}>
                      <button style={themedStyles.saveButton} onClick={saveEdit} disabled={uploading}>
                        {uploading ? '⏳ Saving...' : '✅ Save'}
                      </button>
                      <button style={themedStyles.cancelButton} onClick={cancelEdit}>
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={themedStyles.todoName}>{todo.name}</p>
                    <p style={themedStyles.todoDescription}>{todo.description}</p>
                    {todo.images && todo.images.length > 0 && (
                      <div style={themedStyles.imageFrame}>
                        <MultiImageDisplay imagePaths={todo.images.filter((img): img is string => img !== null)} />
                      </div>
                    )}
                    {todo.id && todo.owner === user?.username && (
                      <div style={themedStyles.buttonGroup}>
                        <button style={themedStyles.editButton} onClick={() => startEdit(todo as Todo)}>
                          ✏️ Edit
                        </button>
                        <button style={themedStyles.deleteButton} onClick={() => removeTodo(todo.id!)}>
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component that handles authentication state
const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    }
  }

  // Show loading while checking auth state
  if (isAuthenticated === null) {
    return (
      <div style={getThemedStyles('light').container}>
        <Heading level={1}>Loading...</Heading>
      </div>
    );
  }

  // Show authenticated app if user is logged in
  if (isAuthenticated && user) {
    return (
      <AuthenticatedApp
        user={user}
        signOut={async () => {
          try {
            await amplifySignOut();
            setIsAuthenticated(false);
            setUser(null);
            // Reload page to ensure clean state
            window.location.reload();
          } catch (error) {
            console.log('error signing out:', error);
          }
        }}
      />
    );
  }

  // Show read-only app for unauthenticated users
  return <ReadOnlyApp />;
};

// Main App with Theme Provider
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

const styles = {
  container: {
    padding: 20,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: 1200,
    margin: '0 auto 30px auto',
  },
  mainContent: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: 30,
    alignItems: 'start',
  },
  formCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky' as const,
    top: 20,
  },
  todoListContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 20,
  },
  todo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #e1e8ed',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    height: 'fit-content',
  },
  todoHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  },
  input: {
    border: '2px solid #e1e8ed',
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  inputFocus: {
    borderColor: '#007bff',
    boxShadow: '0 0 0 3px rgba(0,123,255,0.1)',
    outline: 'none',
  },
  todoName: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 0,
  },
  todoDescription: {
    fontSize: 16,
    color: '#5a6c7d',
    marginBottom: 12,
    lineHeight: 1.5,
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    fontSize: 16,
    padding: '14px 24px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: '600' as const,
    width: '100%',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
    transform: 'translateY(-1px)',
  },
  fileSelected: {
    fontSize: 14,
    color: '#28a745',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#d4edda',
    borderRadius: 6,
    border: '1px solid #c3e6cb',
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #e1e8ed',
  },
  imageFrame: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginTop: 16,
    border: '1px solid #e1e8ed',
    textAlign: 'center' as const,
  },
  buttonGroup: {
    display: 'flex',
    gap: 8,
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s ease',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s ease',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '600' as const,
    transition: 'background-color 0.2s ease',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s ease',
  },
  readOnlyMessage: {
    textAlign: 'center' as const,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    border: '1px solid #bbdefb',
    color: '#1565c0',
  },
  loginButton: {
    marginLeft: 12,
    padding: '10px 20px',
    fontSize: 14,
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '600' as const,
  },
  emptyMessage: {
    textAlign: 'center' as const,
    color: '#6c757d',
    fontStyle: 'italic' as const,
    fontSize: 16,
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    gridColumn: '1 / -1',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  todoList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 20,
    maxWidth: 1200,
    margin: '0 auto',
  },
  downloadButton: {
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '500' as const,
    marginTop: 12,
    transition: 'background-color 0.2s ease',
  },
  tooltip: {
    position: 'absolute' as const,
    top: -10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    pointerEvents: 'none' as const,
  },
  tooltipContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 12,
    lineHeight: 1.4,
    minWidth: 200,
    maxWidth: 300,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    textAlign: 'left' as const,
  },
  imageSelector: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    border: '1px solid #e1e8ed',
  },
  imageSelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 0,
  },
  imageThumbnails: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  thumbnailButton: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    border: '1px solid #ced4da',
    padding: '6px 12px',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: '500' as const,
    transition: 'all 0.2s ease',
  },
  thumbnailButtonActive: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff',
  },
  editImageSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    border: '1px solid #e1e8ed',
  },
  editSectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 0,
  },
  editImageList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  editImageItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 6,
    border: '1px solid #dee2e6',
  },
  editImageName: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  removeImageButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  addImagesButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    fontSize: 14,
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: '500' as const,
    marginTop: 8,
    transition: 'background-color 0.2s ease',
  },
  // Responsive styles for smaller screens
  '@media (max-width: 768px)': {
    mainContent: {
      gridTemplateColumns: '1fr',
      gap: 20,
    },
    formCard: {
      position: 'static' as const,
    },
  },
} as const;

export default App;
