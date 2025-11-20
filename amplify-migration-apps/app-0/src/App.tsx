/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState, useRef, createContext, useContext } from 'react';

import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, downloadData, getProperties } from 'aws-amplify/storage';

import { Button, Heading, Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { type AuthUser } from 'aws-amplify/auth';
import { type UseAuthenticator } from '@aws-amplify/ui-react-core';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';

import { deleteProject, createTodo, updateTodo, createProject, updateProject, deleteTodo } from './graphql/mutations';
import { listTodos, listProjects } from './graphql/queries';
import { type CreateTodoInput, type Todo, type UpdateTodoInput, type CreateProjectInput, type Project, type ProjectStatus } from './API';

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
      borderRadius: 8,
      width: 'fit-content',
      margin: '0 auto 30px auto',
      color: isDark ? '#e1e8ed' : '#2c3e50',
    },
    mainContent: {
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
      padding: 12,
      borderRadius: 6,
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
      border: isDark ? '1px solid #4a5568' : '1px solid #e1e8ed',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      height: 'fit-content',
      width: 'fit-content',
      minWidth: '300px',
      maxWidth: '600px',
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
      backgroundColor: '#e09d00ff',
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [unassignedTodos, setUnassignedTodos] = useState<Todo[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const themedStyles = getThemedStyles(theme);

  const statusColors: Record<ProjectStatus, string> = {
    ACTIVE: '#28a745',
    COMPLETED: '#6c757d',
    ON_HOLD: '#ffc107',
    ARCHIVED: '#6f42c1',
  };

  const statusEmojis: Record<ProjectStatus, string> = {
    ACTIVE: '🚀',
    COMPLETED: '✅',
    ON_HOLD: '⏸️',
    ARCHIVED: '📦',
  };

  useEffect(() => {
    fetchProjects();
    fetchTodos();
  }, []);

  async function fetchProjects() {
    try {
      const projectData = await publicClient.graphql({
        query: listProjects,
      });
      const fetchedProjects = (projectData.data.listProjects?.items?.filter(Boolean) as Project[]) || [];
      setProjects(fetchedProjects);
    } catch (err) {
      console.log('Error fetching projects:', err);
    }
  }

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

  // Update unassigned todos when todos or projects change
  useEffect(() => {
    const projectIds = new Set(projects.map((p) => p.id));
    setUnassignedTodos(todos.filter((todo) => !todo.projectID || !projectIds.has(todo.projectID)));
  }, [todos, projects]);

  if (showLogin) {
    return <Authenticator>{({ signOut, user }) => <AuthenticatedApp signOut={signOut} user={user} />}</Authenticator>;
  }

  return (
    <div style={themedStyles.container}>
      <div style={themedStyles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading level={1} style={themedStyles.header}>
            📋 Project Boards
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

      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        {/* Project Boards */}
        {projects.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24, alignItems: 'flex-start' }}>
            {projects.map((project) => {
              const projectTodos = todos.filter((todo) => todo.projectID === project.id);
              
              return (
                <div
                  key={project.id}
                  style={{
                    ...themedStyles.todo,
                    borderLeft: `4px solid ${project.color || statusColors[project.status]}`,
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ ...themedStyles.todoName, margin: 0, wordBreak: 'break-word' }}>
                      {statusEmojis[project.status]} {project.title}
                    </h3>
                    <p style={{ ...themedStyles.todoDescription, margin: '4px 0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                      {project.description}
                    </p>
                    <span
                      style={{
                        fontSize: 12,
                        padding: '4px 8px',
                        borderRadius: 4,
                        backgroundColor: statusColors[project.status],
                        color: 'white',
                        fontWeight: '600',
                      }}
                    >
                      {project.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, color: themedStyles.todoDescription.color, marginBottom: 12 }}>
                    📋 {projectTodos.length} todo{projectTodos.length !== 1 ? 's' : ''}
                  </div>

                  {projectTodos.length > 0 && (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {projectTodos.map((todo) => (
                        <div
                          key={todo.id}
                          style={{
                            padding: 12,
                            backgroundColor: theme === 'dark' ? '#374151' : '#f8f9fa',
                            borderRadius: 8,
                            border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                          }}
                        >
                          <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: 14 }}>{todo.name}</p>
                          <p style={{ margin: '0', fontSize: 12, color: themedStyles.todoDescription.color }}>{todo.description}</p>
                          {todo.images && todo.images.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <MultiImageDisplay imagePaths={todo.images.filter((img): img is string => img !== null)} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Unassigned Todos */}
        {unassignedTodos.length > 0 && (
          <div
            style={{
              ...themedStyles.todo,
              borderLeft: `4px solid #6c757d`,
              marginBottom: 24,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ ...themedStyles.todoName, margin: 0 }}>📝 Unassigned Todos</h3>
              <p style={{ ...themedStyles.todoDescription, margin: '4px 0' }}>Todos that haven't been assigned to any project</p>
              <span
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 4,
                  backgroundColor: '#6c757d',
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                DEFAULT
              </span>
            </div>

            <div style={{ fontSize: 14, color: themedStyles.todoDescription.color, marginBottom: 12 }}>
              📋 {unassignedTodos.length} todo{unassignedTodos.length !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {unassignedTodos.map((todo) => (
                <div
                  key={todo.id}
                  style={{
                    padding: 12,
                    backgroundColor: theme === 'dark' ? '#374151' : '#f8f9fa',
                    borderRadius: 8,
                    border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: 14 }}>{todo.name}</p>
                  <p style={{ margin: '0', fontSize: 12, color: themedStyles.todoDescription.color }}>{todo.description}</p>
                  {todo.images && todo.images.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <MultiImageDisplay imagePaths={todo.images.filter((img): img is string => img !== null)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {projects.length === 0 && todos.length === 0 && (
          <div style={themedStyles.emptyMessage}>
            <h3>🚀 Welcome to Project Boards!</h3>
            <p>No projects or todos yet. Sign in to create some!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Project Board component
const ProjectBoard: React.FC<{
  project: Project;
  todos: Todo[];
  projects: Project[];
  onTodoUpdate: (todo: Todo) => void;
  onTodoDelete: (todoId: string) => void;
  onProjectUpdate: (project: Project) => void;
  onProjectDelete: (projectId: string) => void;
  user?: AuthUser;
}> = ({ project, todos, projects, onTodoUpdate, onTodoDelete, onProjectUpdate, onProjectDelete, user }) => {
  const { theme } = useTheme();
  const themedStyles = getThemedStyles(theme);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: project.title,
    description: project.description || '',
    status: project.status,
    color: project.color || '#007bff',
  });

  const projectTodos = todos.filter((todo) => todo.projectID === project.id);

  const statusColors: Record<ProjectStatus, string> = {
    ACTIVE: '#28a745',
    COMPLETED: '#6c757d',
    ON_HOLD: '#ffc107',
    ARCHIVED: '#6f42c1',
  };

  const statusEmojis: Record<ProjectStatus, string> = {
    ACTIVE: '🚀',
    COMPLETED: '✅',
    ON_HOLD: '⏸️',
    ARCHIVED: '📦',
  };

  async function handleUpdateProject() {
    try {
      const result = await authenticatedClient.graphql({
        query: updateProject,
        variables: {
          input: {
            id: project.id,
            title: editForm.title,
            description: editForm.description,
            status: editForm.status,
            color: editForm.color,
          },
        },
      });
      if ((result as any).data?.updateProject) {
        onProjectUpdate((result as any).data.updateProject as Project);
        setIsEditing(false);
      }
    } catch (err) {
      console.log('Error updating project:', err);
    }
  }

  const projectStyle = {
    ...themedStyles.todo,
    borderLeft: `4px solid ${project.color || statusColors[project.status]}`,
  };

  return (
    <div style={projectStyle}>
      {isEditing ? (
        <div>
          <input
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            style={themedStyles.input}
            placeholder="Project title"
          />
          <input
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            style={themedStyles.input}
            placeholder="Project description"
          />
          <select
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProjectStatus })}
            style={themedStyles.input}
          >
            <option value="ACTIVE">🚀 Active</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="ON_HOLD">⏸️ On Hold</option>
            <option value="ARCHIVED">📦 Archived</option>
          </select>
          <input
            type="color"
            value={editForm.color}
            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
            style={{ ...themedStyles.input, height: 50 }}
          />
          <div style={themedStyles.buttonGroup}>
            <button style={themedStyles.saveButton} onClick={handleUpdateProject}>
              ✅ Save Project
            </button>
            <button style={themedStyles.cancelButton} onClick={() => setIsEditing(false)}>
              ❌ Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ flex: 1, marginRight: 16, minWidth: 0 }}>
              <h3 style={{ ...themedStyles.todoName, margin: 0, wordBreak: 'break-word' }}>
                {statusEmojis[project.status]} {project.title}
              </h3>
              <p style={{ ...themedStyles.todoDescription, margin: '4px 0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {project.description}
              </p>
              <span
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  borderRadius: 4,
                  backgroundColor: statusColors[project.status],
                  color: 'white',
                  fontWeight: '600',
                }}
              >
                {project.status}
              </span>
            </div>
            {project.owner === user?.username && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button style={themedStyles.editButton} onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </button>
                <button style={themedStyles.deleteButton} onClick={() => onProjectDelete(project.id)}>
                  ✘ Delete
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: 14, color: themedStyles.todoDescription.color, marginBottom: 12 }}>
            📋 {projectTodos.length} todo{projectTodos.length !== 1 ? 's' : ''}
          </div>

          {projectTodos.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {projectTodos.map((todo) => (
                <TodoCard key={todo.id} todo={todo} onUpdate={onTodoUpdate} onDelete={onTodoDelete} user={user} projects={projects} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Todo Card Component
const TodoCard: React.FC<{
  todo: Todo;
  onUpdate: (todo: Todo) => void;
  onDelete: (todoId: string) => void;
  user?: AuthUser;
  projects?: Project[];
}> = ({ todo, onUpdate, onDelete, user, projects = [] }) => {
  const { theme } = useTheme();
  const themedStyles = getThemedStyles(theme);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormState, setEditFormState] = useState<UpdateTodoInput>({
    id: todo.id,
    name: todo.name,
    description: todo.description || '',
    images: todo.images || [],
    projectID: todo.projectID,
  });
  const [uploading, setUploading] = useState(false);

  async function handleUpdateTodo() {
    try {
      setUploading(true);
      const result = await authenticatedClient.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: editFormState.id,
            name: editFormState.name,
            description: editFormState.description,
            images: editFormState.images,
            projectID: editFormState.projectID || null,
          },
        },
      });
      if ((result as any).data?.updateTodo) {
        onUpdate((result as any).data.updateTodo as Todo);
        setIsEditing(false);
      }
    } catch (err) {
      console.log('Error updating todo:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleProjectChange(newProjectId: string) {
    try {
      setUploading(true);
      const result = await authenticatedClient.graphql({
        query: updateTodo,
        variables: {
          input: {
            id: todo.id,
            name: todo.name,
            description: todo.description,
            images: todo.images,
            projectID: newProjectId || null,
          },
        },
      });
      if ((result as any).data?.updateTodo) {
        onUpdate((result as any).data.updateTodo as Todo);
      }
    } catch (err) {
      console.log('Error updating todo project:', err);
    } finally {
      setUploading(false);
    }
  }

  const cardStyle = {
    padding: 12,
    backgroundColor: theme === 'dark' ? '#374151' : '#f8f9fa',
    borderRadius: 8,
    border: theme === 'dark' ? '1px solid #4b5563' : '1px solid #e5e7eb',
  };

  if (isEditing) {
    return (
      <div style={cardStyle}>
        <input
          value={editFormState.name || ''}
          onChange={(e) => setEditFormState({ ...editFormState, name: e.target.value })}
          style={themedStyles.input}
          placeholder="Todo name"
        />
        <input
          value={editFormState.description || ''}
          onChange={(e) => setEditFormState({ ...editFormState, description: e.target.value })}
          style={themedStyles.input}
          placeholder="Description"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={themedStyles.saveButton} onClick={handleUpdateTodo} disabled={uploading}>
            {uploading ? '⏳' : '✅'} Save
          </button>
          <button style={themedStyles.cancelButton} onClick={() => setIsEditing(false)}>
            ❌ Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: 14 }}>{todo.name}</p>
          <p style={{ margin: '0', fontSize: 12, color: themedStyles.todoDescription.color }}>{todo.description}</p>
        </div>
        {todo.owner === user?.username && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <button style={{ ...themedStyles.editButton, padding: '4px 8px', fontSize: 12 }} onClick={() => setIsEditing(true)}>
              ✏️
            </button>
            <button style={{ ...themedStyles.deleteButton, padding: '4px 8px', fontSize: 12 }} onClick={() => onDelete(todo.id)}>
              ✘
            </button>
          </div>
        )}
      </div>

      {/* Project Selector */}
      {todo.owner === user?.username && projects.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <select
            value={todo.projectID || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            style={{
              ...themedStyles.input,
              marginBottom: 0,
              fontSize: 12,
              padding: 8,
              height: 'auto',
            }}
            disabled={uploading}
          >
            <option value="">📝 Unassigned</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                📋 {project.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {todo.images && todo.images.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <MultiImageDisplay imagePaths={todo.images.filter((img): img is string => img !== null)} />
        </div>
      )}
    </div>
  );
};

// Authenticated App Component
const AuthenticatedApp: React.FC<AppProps> = ({ signOut, user }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [unassignedTodos, setUnassignedTodos] = useState<Todo[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');

  // Project form state
  const [projectForm, setProjectForm] = useState<CreateProjectInput>({
    title: '',
    description: '',
    status: 'ACTIVE' as ProjectStatus,
    color: '#007bff',
  });

  // Todo form state
  const [todoForm, setTodoForm] = useState<CreateTodoInput>({
    name: '',
    description: '',
    images: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme, toggleTheme } = useTheme();
  const themedStyles = getThemedStyles(theme);

  useEffect(() => {
    fetchProjects();
    fetchTodos();
  }, []);

  async function fetchProjects() {
    try {
      const projectData = await publicClient.graphql({
        query: listProjects,
      });
      setProjects((projectData.data.listProjects?.items?.filter(Boolean) as Project[]) || []);
    } catch (err) {
      console.log('Error fetching projects:', err);
    }
  }

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

  async function createNewProject() {
    try {
      if (!projectForm.title) return;

      setUploading(true);
      const result = await authenticatedClient.graphql({
        query: createProject,
        variables: {
          input: projectForm,
        },
      });

      if ((result as any).data?.createProject) {
        setProjects([...projects, (result as any).data.createProject as Project]);
        setProjectForm({
          title: '',
          description: '',
          status: 'ACTIVE' as ProjectStatus,
          color: '#007bff',
        });
        setShowProjectForm(false);
      }
    } catch (err) {
      console.log('Error creating project:', err);
    } finally {
      setUploading(false);
    }
  }

  async function createNewTodo() {
    try {
      if (!todoForm.name) return;

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

      const todoInput = {
        ...todoForm,
        images: imageKeys,
        projectID: selectedProject || undefined,
      };

      const result = await authenticatedClient.graphql({
        query: createTodo,
        variables: {
          input: todoInput,
        },
      });

      if ((result as any).data?.createTodo) {
        setTodos([...todos, (result as any).data.createTodo as Todo]);
        setTodoForm({ name: '', description: '', images: [] });
        setSelectedFiles([]);
        setSelectedProject('');
        setShowTodoForm(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.log('Error creating todo:', err);
    } finally {
      setUploading(false);
    }
  }

  function handleTodoUpdate(updatedTodo: Todo) {
    setTodos(todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)));
  }

  async function handleTodoDelete(todoId: string) {
    try {
      await authenticatedClient.graphql({
        query: deleteTodo,
        variables: {
          input: { id: todoId },
        },
      });
      setTodos(todos.filter((todo) => todo.id !== todoId));
    } catch (err) {
      console.log('Error deleting todo:', err);
    }
  }

  function handleProjectUpdate(updatedProject: Project) {
    setProjects(projects.map((project) => (project.id === updatedProject.id ? updatedProject : project)));
  }

  async function handleProjectDelete(projectId: string) {
    try {
      await authenticatedClient.graphql({
        query: deleteProject,
        variables: {
          input: { id: projectId },
        },
      });
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (err) {
      console.log('Error deleting project:', err);
    }
  }

  // Update unassigned todos when todos or projects change
  useEffect(() => {
    const projectIds = new Set(projects.map((p) => p.id));
    setUnassignedTodos(todos.filter((todo) => !todo.projectID || !projectIds.has(todo.projectID)));
  }, [todos, projects]);

  return (
    <div style={themedStyles.container}>
      <div style={themedStyles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Heading level={1} style={themedStyles.header}>
              📋 Project Boards
            </Heading>
            <Heading
              level={3}
              style={{ ...themedStyles.header, fontSize: 18, marginTop: 8, color: themedStyles.todoDescription.color, textAlign: 'center' }}
            >
              {user?.signInDetails?.loginId || user?.username}
            </Heading>
          </div>
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
        {/* Sidebar with forms */}
        <div style={themedStyles.formCard}>
          {/* Project Form */}
          {showProjectForm ? (
            <div>
              <h2 style={themedStyles.formTitle}>Create Project Board</h2>
              <input
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                style={themedStyles.input}
                placeholder="Project title"
              />
              <input
                value={projectForm.description || ''}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                style={themedStyles.input}
                placeholder="Project description"
              />
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })}
                style={themedStyles.input}
              >
                <option value="ACTIVE">🚀 Active</option>
                <option value="COMPLETED">✅ Completed</option>
                <option value="ON_HOLD">⏸️ On Hold</option>
                <option value="ARCHIVED">📦 Archived</option>
              </select>
              <input
                type="color"
                value={projectForm.color || '#007bff'}
                onChange={(e) => setProjectForm({ ...projectForm, color: e.target.value })}
                style={{ ...themedStyles.input, height: 50 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={themedStyles.saveButton} onClick={createNewProject} disabled={uploading}>
                  {uploading ? '⏳' : '✅'} Create Project
                </button>
                <button style={themedStyles.cancelButton} onClick={() => setShowProjectForm(false)}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : showTodoForm ? (
            <div>
              <h2 style={themedStyles.formTitle}>Create Todo</h2>
              <input
                value={todoForm.name}
                onChange={(e) => setTodoForm({ ...todoForm, name: e.target.value })}
                style={themedStyles.input}
                placeholder="Todo name"
              />
              <input
                value={todoForm.description || ''}
                onChange={(e) => setTodoForm({ ...todoForm, description: e.target.value })}
                style={themedStyles.input}
                placeholder="Description"
              />
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} style={themedStyles.input}>
                <option value="">Select Project (Optional)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} style={themedStyles.input} />
              {selectedFiles.length > 0 && (
                <p style={themedStyles.fileSelected}>
                  📎 Selected: {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={themedStyles.saveButton} onClick={createNewTodo} disabled={uploading}>
                  {uploading ? '⏳' : '✅'} Create Todo
                </button>
                <button style={themedStyles.cancelButton} onClick={() => setShowTodoForm(false)}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 style={themedStyles.formTitle}>Quick Actions</h2>
              <button style={{ ...themedStyles.button, marginBottom: 16 }} onClick={() => setShowProjectForm(true)}>
                🚀 New Project Board
              </button>
              <button style={themedStyles.button} onClick={() => setShowTodoForm(true)}>
                ➕ New Todo
              </button>

              <div style={{ marginTop: 24, padding: 16, backgroundColor: theme === 'dark' ? '#374151' : '#f8f9fa', borderRadius: 8 }}>
                <h3 style={{ ...themedStyles.formTitle, fontSize: 18, marginBottom: 12 }}>📊 Overview</h3>
                <p style={{ margin: '4px 0', fontSize: 14 }}>
                  📋 {projects.length} Project{projects.length !== 1 ? 's' : ''}
                </p>
                <p style={{ margin: '4px 0', fontSize: 14 }}>
                  ✅ {todos.length} Total Todo{todos.length !== 1 ? 's' : ''}
                </p>
                <p style={{ margin: '4px 0', fontSize: 14 }}>📝 {unassignedTodos.length} Unassigned</p>
              </div>
            </div>
          )}
        </div>

        {/* Main content area with project boards */}
        <div>
          {/* Project Boards */}
          {projects.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24, alignItems: 'flex-start' }}>
              {projects.map((project) => (
                <ProjectBoard
                  key={project.id}
                  project={project}
                  todos={todos}
                  projects={projects}
                  onTodoUpdate={handleTodoUpdate}
                  onTodoDelete={handleTodoDelete}
                  onProjectUpdate={handleProjectUpdate}
                  onProjectDelete={handleProjectDelete}
                  user={user}
                />
              ))}
            </div>
          )}

          {/* Default Project Board for Unassigned Todos */}
          {unassignedTodos.length > 0 && (
            <div
              style={{
                ...themedStyles.todo,
                borderLeft: `4px solid #6c757d`,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ ...themedStyles.todoName, margin: 0 }}>📝 Unassigned Todos</h3>
                  <p style={{ ...themedStyles.todoDescription, margin: '4px 0' }}>Todos that haven't been assigned to any project</p>
                  <span
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: 4,
                      backgroundColor: '#6c757d',
                      color: 'white',
                      fontWeight: '600',
                    }}
                  >
                    DEFAULT
                  </span>
                </div>
                <div style={{ fontSize: 12, color: themedStyles.todoDescription.color }}>Cannot be deleted</div>
              </div>

              <div style={{ fontSize: 14, color: themedStyles.todoDescription.color, marginBottom: 12 }}>
                📋 {unassignedTodos.length} todo{unassignedTodos.length !== 1 ? 's' : ''}
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {unassignedTodos.map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onUpdate={handleTodoUpdate}
                    onDelete={handleTodoDelete}
                    user={user}
                    projects={projects}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {projects.length === 0 && todos.length === 0 && (
            <div style={themedStyles.emptyMessage}>
              <h3>🚀 Welcome to Project Boards!</h3>
              <p>Create your first project board to organize your todos</p>
            </div>
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
