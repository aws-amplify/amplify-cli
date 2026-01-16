/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState, useRef } from 'react';

import { generateClient } from 'aws-amplify/api';
import { post } from 'aws-amplify/api';

import { Button, Heading, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { type AuthUser } from 'aws-amplify/auth';
import { type UseAuthenticator } from '@aws-amplify/ui-react-core';

import {
  deleteWorkoutProgram,
  createExercise,
  updateExercise,
  createWorkoutProgram,
  updateWorkoutProgram,
  deleteExercise,
} from './graphql/mutations';
import { listExercises, listWorkoutPrograms, listMeals } from './graphql/queries';
import {
  type CreateExerciseInput,
  type Exercise,
  type UpdateExerciseInput,
  type CreateWorkoutProgramInput,
  type WorkoutProgram,
  type WorkoutProgramStatus,
  type Meal,
} from './API';

// Client for authenticated users (owner-based operations)
const authenticatedClient = generateClient({
  authMode: 'userPool',
});

const publicClient = generateClient({
  authMode: 'apiKey',
});

type AppProps = {
  signOut?: UseAuthenticator['signOut'];
  user?: AuthUser;
};

const getStyles = () => {
  const isDark = true;

  return {
    container: {
      padding: 20,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: isDark ? '#1a1a1a' : '#f0f4f8',
      minHeight: '100vh',
      color: isDark ? '#e1e8ed' : '#2d3748',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: 30,
      padding: 20,
      backgroundColor: isDark ? '#2d3748' : 'white',
      borderRadius: 8,
      width: 'fit-content',
      margin: '0 auto 30px auto',
      color: isDark ? '#e1e8ed' : '#2d3748',
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
    excerciseListContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: 20,
    },
    excercise: {
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
      color: isDark ? '#e1e8ed' : '#2d3748',
    },
    excerciseName: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: isDark ? '#e1e8ed' : '#2d3748',
      marginBottom: 8,
      marginTop: 0,
    },
    excerciseDescription: {
      fontSize: 16,
      color: isDark ? '#a0aec0' : '#5a6c7d',
      marginBottom: 12,
      lineHeight: 1.5,
    },
    button: {
      backgroundColor: '#e85d04',
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
      color: '#2a9d8f',
      marginBottom: 16,
      padding: 8,
      backgroundColor: isDark ? '#1a3a35' : '#d4f1e8',
      borderRadius: 6,
      border: isDark ? '1px solid #2a9d8f' : '1px solid #a7dfd0',
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
      backgroundColor: '#f48c06',
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
      backgroundColor: '#d62828',
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
      backgroundColor: '#2a9d8f',
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
      backgroundColor: '#e85d04',
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
      color: isDark ? '#e1e8ed' : '#2d3748',
      marginBottom: 20,
      textAlign: 'center' as const,
    },
    excerciseList: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 20,
      maxWidth: 1200,
      margin: '0 auto',
    },
    editSectionLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: isDark ? '#e1e8ed' : '#2d3748',
      marginBottom: 8,
      marginTop: 0,
    },
    // Modal styles
    modalOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: isDark ? '#2d3748' : 'white',
      borderRadius: 12,
      padding: 24,
      maxWidth: 600,
      maxHeight: '80vh',
      width: '90%',
      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.2)',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: isDark ? '1px solid #4a5568' : '1px solid #e1e8ed',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: isDark ? '#e1e8ed' : '#2d3748',
      margin: 0,
    },
    modalCloseButton: {
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: 24,
      color: isDark ? '#a0aec0' : '#6c757d',
      cursor: 'pointer',
      padding: 4,
      borderRadius: 4,
      transition: 'background-color 0.2s ease',
    },
    modalBody: {
      maxHeight: '60vh',
      overflowY: 'auto' as const,
    },
    activityItem: {
      padding: 12,
      marginBottom: 12,
      backgroundColor: isDark ? '#374151' : '#f8f9fa',
      borderRadius: 8,
      border: isDark ? '1px solid #4b5563' : '1px solid #e1e8ed',
    },
    activityTimestamp: {
      fontSize: 12,
      color: isDark ? '#a0aec0' : '#6c757d',
      marginBottom: 4,
      fontWeight: '500' as const,
    },
    activityContent: {
      fontSize: 14,
      color: isDark ? '#e1e8ed' : '#2d3748',
      lineHeight: 1.4,
    },
    authActivityButton: {
      backgroundColor: '#6366f1',
      color: 'white',
      border: 'none',
      padding: '10px 16px',
      fontSize: 14,
      borderRadius: 6,
      cursor: 'pointer',
      fontWeight: '600' as const,
      transition: 'background-color 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
  };
};

// Nutrition Summary Component
const MealLogger: React.FC<{ user?: AuthUser; onMealLogged: () => void }> = ({ user, onMealLogged }) => {
  const [foodContent, setFoodContent] = useState('');
  const [logging, setLogging] = useState(false);
  const themedStyles = getStyles();

  async function logMeal() {
    if (!foodContent.trim() || !user) return;

    try {
      setLogging(true);
      await post({
        apiName: 'nutritionapi',
        path: '/nutrition/log',
        options: {
          body: {
            content: foodContent.trim(),
            userName: user.username,
          },
        },
      }).response;

      setFoodContent('');
      onMealLogged();
    } catch (error) {
      console.log('Error logging meal:', error);
    } finally {
      setLogging(false);
    }
  }

  if (!user) return null;

  return (
    <div>
      <input
        value={foodContent}
        onChange={(e) => setFoodContent(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && logMeal()}
        style={themedStyles.input}
        placeholder="Enter food details (e.g., 1 apple, 2 slices of bread, chicken breast)"
      />
      <button style={themedStyles.button} onClick={logMeal} disabled={logging || !foodContent.trim()}>
        {logging ? '⏳ Submitting...' : 'Submit'}
      </button>
    </div>
  );
};
// Nutrition Summary Component
const NutritionSummary: React.FC<{ user?: AuthUser }> = ({ user }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const themedStyles = getStyles();

  async function fetchMeals() {
    try {
      setLoading(true);
      const data = await publicClient.graphql({
        query: listMeals,
      });
      const meals = data.data.listMeals.items.filter((i) => i.userName === user!.username);
      setMeals(meals);
    } catch (err) {
      console.log(`error fetching meals: ${JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeals();
  }, []);

  if (!user) return null;

  return (
    <div style={{ ...themedStyles.excercise, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ ...themedStyles.excerciseName, margin: 0 }}>🍎 Meals </h3>
        <button style={{ ...themedStyles.editButton, padding: '4px 8px', fontSize: 12 }} onClick={fetchMeals} disabled={loading}>
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {meals.length > 0 ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {meals.map((meal) => (
            <div
              key={meal.id}
              style={{
                padding: 12,
                backgroundColor: '#374151',
                borderRadius: 8,
                border: '1px solid #4b5563',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: 14, color: '#e1e8ed' }}>{meal.content}</p>
                  <p style={{ margin: 0, fontSize: 12, color: themedStyles.excerciseDescription.color }}>
                    🕒 {new Date(meal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: themedStyles.excerciseDescription.color, fontStyle: 'italic' }}>
          {loading ? 'Loading nutrition data...' : 'No meals logged'}
        </p>
      )}
    </div>
  );
};

// Workout Program component
const WorkoutProgramBoard: React.FC<{
  workoutProgram: WorkoutProgram;
  excercises: Exercise[];
  workoutPrograms: WorkoutProgram[];
  onExcerciseUpdate: (excercise: Exercise) => void;
  onExcerciseDelete: (excerciseId: string) => void;
  onWorkoutProgramUpdate: (workoutProgram: WorkoutProgram) => void;
  onWorkoutProgramDelete: (workoutProgramId: string) => void;
  user?: AuthUser;
}> = ({
  workoutProgram,
  excercises,
  workoutPrograms,
  onExcerciseUpdate,
  onExcerciseDelete,
  onWorkoutProgramUpdate,
  onWorkoutProgramDelete,
  user,
}) => {
  const themedStyles = getStyles();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: workoutProgram.title,
    description: workoutProgram.description || '',
    status: workoutProgram.status,
    color: workoutProgram.color || '#e85d04',
  });

  const workoutProgramExcercises = excercises.filter((excercise) => excercise.workoutProgramId === workoutProgram.id);

  const statusColors: Record<WorkoutProgramStatus, string> = {
    ACTIVE: '#e85d04',
    COMPLETED: '#2a9d8f',
    ON_HOLD: '#f48c06',
    ARCHIVED: '#6c757d',
  };

  const statusEmojis: Record<WorkoutProgramStatus, string> = {
    ACTIVE: '💪',
    COMPLETED: '✅',
    ON_HOLD: '⏸️',
    ARCHIVED: '📦',
  };

  async function handleUpdateWorkoutProgram() {
    try {
      const result = await authenticatedClient.graphql({
        query: updateWorkoutProgram,
        variables: {
          input: {
            id: workoutProgram.id,
            title: editForm.title,
            description: editForm.description,
            status: editForm.status,
            color: editForm.color,
          },
        },
      });
      if ((result as any).data?.updateWorkoutProgram) {
        onWorkoutProgramUpdate((result as any).data.updateWorkoutProgram as WorkoutProgram);
        setIsEditing(false);
      }
    } catch (err) {
      console.log('Error updating workout program:', err);
    }
  }

  const workoutProgramStyle = {
    ...themedStyles.excercise,
    borderLeft: `4px solid ${workoutProgram.color || statusColors[workoutProgram.status]}`,
  };

  return (
    <div style={workoutProgramStyle}>
      {isEditing ? (
        <div>
          <input
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            style={themedStyles.input}
            placeholder="Program name"
          />
          <input
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            style={themedStyles.input}
            placeholder="Program description"
          />
          <select
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as WorkoutProgramStatus })}
            style={themedStyles.input}
          >
            <option value="ACTIVE">💪 Active</option>
            <option value="COMPLETED">✅ Achieved</option>
            <option value="ON_HOLD">⏸️ Paused</option>
            <option value="ARCHIVED">📦 Archived</option>
          </select>
          <input
            type="color"
            value={editForm.color}
            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
            style={{ ...themedStyles.input, height: 50 }}
          />
          <div style={themedStyles.buttonGroup}>
            <button style={themedStyles.saveButton} onClick={handleUpdateWorkoutProgram}>
              ✅ Save Program
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
              <h3 style={{ ...themedStyles.excerciseName, margin: 0, wordBreak: 'break-word' }}>
                {statusEmojis[workoutProgram.status]} {workoutProgram.title}
              </h3>
              <p style={{ ...themedStyles.excerciseDescription, margin: '4px 0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {workoutProgram.description}
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 4,
                    backgroundColor: statusColors[workoutProgram.status],
                    color: 'white',
                    fontWeight: '600',
                  }}
                >
                  {workoutProgram.status}
                </span>
                {workoutProgram.owner && (
                  <span style={{ fontSize: 11, color: themedStyles.excerciseDescription.color, fontStyle: 'italic' }}>
                    👤 {workoutProgram.owner === user?.username ? 'You' : `Athlete: ${workoutProgram.owner}`}
                  </span>
                )}
              </div>
            </div>
            {workoutProgram.owner === user?.username && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button style={themedStyles.editButton} onClick={() => setIsEditing(true)}>
                  ✏️ Edit
                </button>
                <button style={themedStyles.deleteButton} onClick={() => onWorkoutProgramDelete(workoutProgram.id)}>
                  ✘ Delete
                </button>
              </div>
            )}
          </div>

          <div style={{ fontSize: 14, color: themedStyles.excerciseDescription.color, marginBottom: 12 }}>
            🏋️ {workoutProgramExcercises.length} exercise{workoutProgramExcercises.length !== 1 ? 's' : ''}
          </div>

          {workoutProgramExcercises.length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {workoutProgramExcercises.map((excercise) => (
                <ExcerciseCard
                  key={excercise.id}
                  excercise={excercise}
                  onUpdate={onExcerciseUpdate}
                  onDelete={onExcerciseDelete}
                  user={user}
                  workoutPrograms={workoutPrograms}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Exercise Card Component
const ExcerciseCard: React.FC<{
  excercise: Exercise;
  onUpdate: (excercise: Exercise) => void;
  onDelete: (excerciseId: string) => void;
  user?: AuthUser;
  workoutPrograms?: WorkoutProgram[];
}> = ({ excercise, onUpdate, onDelete, user, workoutPrograms = [] }) => {
  const themedStyles = getStyles();
  const [isEditing, setIsEditing] = useState(false);
  const [editFormState, setEditFormState] = useState<UpdateExerciseInput>({
    id: excercise.id,
    name: excercise.name,
    description: excercise.description || '',
    workoutProgramId: excercise.workoutProgramId,
  });
  const [uploading, setUploading] = useState(false);

  async function handleUpdateExcercise() {
    try {
      setUploading(true);
      const result = await authenticatedClient.graphql({
        query: updateExercise,
        variables: {
          input: {
            id: editFormState.id,
            name: editFormState.name,
            description: editFormState.description,
            workoutProgramId: editFormState.workoutProgramId || null,
          },
        },
      });
      if ((result as any).data?.updatedExcercise) {
        onUpdate((result as any).data.updatedExcercise as Exercise);
        setIsEditing(false);
      }
    } catch (err) {
      console.log('Error updating exercise:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleWorkoutProgramChange(newWorkoutProgramId: string) {
    try {
      setUploading(true);
      const result = await authenticatedClient.graphql({
        query: updateExercise,
        variables: {
          input: {
            id: excercise.id,
            name: excercise.name,
            description: excercise.description,
            workoutProgramId: newWorkoutProgramId || null,
          },
        },
      });
      if ((result as any).data?.updatedExcercise) {
        onUpdate((result as any).data.updatedExcercise as Exercise);
      }
    } catch (err) {
      console.log('Error updating exercise program:', err);
    } finally {
      setUploading(false);
    }
  }

  const cardStyle = {
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
    border: '1px solid #4b5563',
  };

  if (isEditing) {
    return (
      <div style={cardStyle}>
        <input
          value={editFormState.name || ''}
          onChange={(e) => setEditFormState({ ...editFormState, name: e.target.value })}
          style={themedStyles.input}
          placeholder="Exercise name"
        />
        <input
          value={editFormState.description || ''}
          onChange={(e) => setEditFormState({ ...editFormState, description: e.target.value })}
          style={themedStyles.input}
          placeholder="Description (sets, reps, notes)"
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={themedStyles.saveButton} onClick={handleUpdateExcercise} disabled={uploading}>
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
          <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: 14 }}>{excercise.name}</p>
          <p style={{ margin: '0 0 4px 0', fontSize: 12, color: themedStyles.excerciseDescription.color }}>{excercise.description}</p>
          {excercise.owner && (
            <p style={{ margin: 0, fontSize: 10, color: themedStyles.excerciseDescription.color, fontStyle: 'italic' }}>
              👤 {excercise.owner === user?.username ? 'You' : `Athlete: ${excercise.owner}`}
            </p>
          )}
        </div>
        {excercise.owner === user?.username && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <button style={{ ...themedStyles.editButton, padding: '4px 8px', fontSize: 12 }} onClick={() => setIsEditing(true)}>
              ✏️
            </button>
            <button style={{ ...themedStyles.deleteButton, padding: '4px 8px', fontSize: 12 }} onClick={() => onDelete(excercise.id)}>
              ✘
            </button>
          </div>
        )}
      </div>

      {/* Program Selector */}
      {excercise.owner === user?.username && workoutPrograms.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <select
            value={excercise.workoutProgramId || ''}
            onChange={(e) => handleWorkoutProgramChange(e.target.value)}
            style={{
              ...themedStyles.input,
              marginBottom: 0,
              fontSize: 12,
              padding: 8,
              height: 'auto',
            }}
            disabled={uploading}
          >
            <option value="">🏃 Standalone</option>
            {workoutPrograms.map((wp) => (
              <option key={wp.id} value={wp.id}>
                💪 {wp.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

// Authenticated App Component
const App: React.FC<AppProps> = ({ signOut, user }) => {
  const [workoutPrograms, setWorkoutPrograms] = useState<WorkoutProgram[]>([]);
  const [excercises, setExcercises] = useState<Exercise[]>([]);
  const [unassignedExcercises, setUnassignedExcercises] = useState<Exercise[]>([]);
  const [showWorkoutProgramForm, setShowWorkoutProgramForm] = useState(false);
  const [showExcerciseForm, setShowExcerciseForm] = useState(false);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [selectedWorkoutProgramId, setSelectedWorkoutProgramId] = useState<string>('');

  const [workoutProgramForm, setWorkoutProgramForm] = useState<CreateWorkoutProgramInput>({
    title: '',
    description: '',
    status: 'ACTIVE' as WorkoutProgramStatus,
    color: '#e85d04',
  });

  const [excerciseForm, setExcerciseForm] = useState<CreateExerciseInput>({
    name: '',
    description: '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themedStyles = getStyles();

  useEffect(() => {
    fetchWorkoutPrograms();
    fetchExcercises();
  }, []);

  async function fetchWorkoutPrograms() {
    try {
      const result = await authenticatedClient.graphql({
        query: listWorkoutPrograms,
      });
      setWorkoutPrograms((result.data.listWorkoutPrograms?.items?.filter(Boolean) as WorkoutProgram[]) || []);
    } catch (err) {
      console.log('Error fetching workout programs:', err);
    }
  }

  async function fetchExcercises() {
    try {
      const data = await authenticatedClient.graphql({
        query: listExercises,
      });
      const excercises = data.data.listExercises.items;
      setExcercises(excercises);
    } catch (err) {
      console.log(`error fetching exercises: ${JSON.stringify(err)}`);
    }
  }

  async function createNewWorkoutProgram() {
    try {
      if (!workoutProgramForm.title) return;

      setUploading(true);
      const result = await authenticatedClient.graphql({
        query: createWorkoutProgram,
        variables: {
          input: workoutProgramForm,
        },
      });

      if ((result as any).data?.createWorkoutProgram) {
        setWorkoutPrograms([...workoutPrograms, (result as any).data.createWorkoutProgram as WorkoutProgram]);
        setWorkoutProgramForm({
          title: '',
          description: '',
          status: 'ACTIVE' as WorkoutProgramStatus,
          color: '#e85d04',
        });
        setShowWorkoutProgramForm(false);
      }
    } catch (err) {
      console.log('Error creating workout program:', err);
    } finally {
      setUploading(false);
    }
  }

  async function createNewExcercise() {
    try {
      if (!excerciseForm.name) return;

      setUploading(true);

      const excerciseInput: CreateExerciseInput = {
        ...excerciseForm,
        workoutProgramId: selectedWorkoutProgramId || undefined,
      };

      const result = await authenticatedClient.graphql({
        query: createExercise,
        variables: {
          input: excerciseInput,
        },
      });

      if ((result as any).data?.createExercise) {
        setExcercises([...excercises, (result as any).data.createExercise as Exercise]);
        setExcerciseForm({ name: '', description: '' });
        setSelectedWorkoutProgramId('');
        setShowExcerciseForm(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      console.log('Error creating exercise:', err);
    } finally {
      setUploading(false);
    }
  }

  function handleExcerciseUpdate(updatedExcercise: Exercise) {
    setExcercises(excercises.map((excercise) => (excercise.id === updatedExcercise.id ? updatedExcercise : excercise)));
  }

  async function handleExcerciseDelete(excerciseId: string) {
    try {
      await authenticatedClient.graphql({
        query: deleteExercise,
        variables: {
          input: { id: excerciseId },
        },
      });
      setExcercises(excercises.filter((excercise) => excercise.id !== excerciseId));
    } catch (err) {
      console.log('Error deleting exercise:', err);
    }
  }

  function handleWorkoutProgramUpdate(updatedWorkoutProgram: WorkoutProgram) {
    setWorkoutPrograms(
      workoutPrograms.map((workoutProgram) => (workoutProgram.id === updatedWorkoutProgram.id ? updatedWorkoutProgram : workoutProgram)),
    );
  }

  async function handleWorkoutProgramDelete(workoutProgramId: string) {
    try {
      await authenticatedClient.graphql({
        query: deleteWorkoutProgram,
        variables: {
          input: { id: workoutProgramId },
        },
      });
      setWorkoutPrograms(workoutPrograms.filter((workoutProgram) => workoutProgram.id !== workoutProgramId));
    } catch (err) {
      console.log('Error deleting workout program:', err);
    }
  }

  useEffect(() => {
    const workoutProgramIds = new Set(workoutPrograms.map((p) => p.id));
    setUnassignedExcercises(
      excercises.filter((excercise) => !excercise.workoutProgramId || !workoutProgramIds.has(excercise.workoutProgramId)),
    );
  }, [excercises, workoutPrograms]);

  return (
    <div style={themedStyles.container}>
      <div style={themedStyles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Heading level={1} style={themedStyles.header}>
              💪 Fitness Tracker
            </Heading>
            <Heading
              level={3}
              style={{
                ...themedStyles.header,
                fontSize: 18,
                marginTop: 8,
                color: themedStyles.excerciseDescription.color,
                textAlign: 'center',
              }}
            >
              {user?.signInDetails?.loginId || user?.username}
            </Heading>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Button style={themedStyles.button} onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div style={themedStyles.mainContent}>
        {/* Sidebar with forms */}
        <div style={themedStyles.formCard}>
          {/* Program Form */}
          {showWorkoutProgramForm ? (
            <div>
              <h2 style={themedStyles.formTitle}>Create Workout Program</h2>
              <input
                value={workoutProgramForm.title}
                onChange={(e) => setWorkoutProgramForm({ ...workoutProgramForm, title: e.target.value })}
                style={themedStyles.input}
                placeholder="Program name"
              />
              <input
                value={workoutProgramForm.description || ''}
                onChange={(e) => setWorkoutProgramForm({ ...workoutProgramForm, description: e.target.value })}
                style={themedStyles.input}
                placeholder="Program description"
              />
              <select
                value={workoutProgramForm.status}
                onChange={(e) => setWorkoutProgramForm({ ...workoutProgramForm, status: e.target.value as WorkoutProgramStatus })}
                style={themedStyles.input}
              >
                <option value="ACTIVE">💪 Active</option>
                <option value="COMPLETED">✅ Achieved</option>
                <option value="ON_HOLD">⏸️ Paused</option>
                <option value="ARCHIVED">📦 Archived</option>
              </select>
              <input
                type="color"
                value={workoutProgramForm.color || '#e85d04'}
                onChange={(e) => setWorkoutProgramForm({ ...workoutProgramForm, color: e.target.value })}
                style={{ ...themedStyles.input, height: 50 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={themedStyles.saveButton} onClick={createNewWorkoutProgram} disabled={uploading}>
                  {uploading ? '⏳' : '✅'} Create Program
                </button>
                <button style={themedStyles.cancelButton} onClick={() => setShowWorkoutProgramForm(false)}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : showExcerciseForm ? (
            <div>
              <h2 style={themedStyles.formTitle}>Add Exercise</h2>
              <input
                value={excerciseForm.name}
                onChange={(e) => setExcerciseForm({ ...excerciseForm, name: e.target.value })}
                style={themedStyles.input}
                placeholder="Exercise name"
              />
              <input
                value={excerciseForm.description || ''}
                onChange={(e) => setExcerciseForm({ ...excerciseForm, description: e.target.value })}
                style={themedStyles.input}
                placeholder="Sets, reps, notes"
              />
              <select
                value={selectedWorkoutProgramId}
                onChange={(e) => setSelectedWorkoutProgramId(e.target.value)}
                style={themedStyles.input}
              >
                <option value="">Select Program (Optional)</option>
                {workoutPrograms.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.title}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={themedStyles.saveButton} onClick={createNewExcercise} disabled={uploading}>
                  {uploading ? '⏳' : '✅'} Add Exercise
                </button>
                <button style={themedStyles.cancelButton} onClick={() => setShowExcerciseForm(false)}>
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : showNutritionForm ? (
            <div>
              <h2 style={themedStyles.formTitle}>Log Meal</h2>
              <MealLogger
                user={user}
                onMealLogged={() => {
                  setShowNutritionForm(false);
                }}
              />
              <button style={themedStyles.cancelButton} onClick={() => setShowNutritionForm(false)}>
                ❌ Cancel
              </button>
            </div>
          ) : (
            <div>
              <h2 style={themedStyles.formTitle}>Quick Actions</h2>
              <button style={{ ...themedStyles.button, marginBottom: 16 }} onClick={() => setShowWorkoutProgramForm(true)}>
                💪 New Workout Program
              </button>
              <button style={{ ...themedStyles.button, marginBottom: 16 }} onClick={() => setShowExcerciseForm(true)}>
                ➕ Add Exercise
              </button>
              <button style={themedStyles.button} onClick={() => setShowNutritionForm(true)}>
                🍎 Log Meal
              </button>

              <div style={{ marginTop: 24, padding: 16, backgroundColor: '#374151', borderRadius: 8 }}>
                <h3 style={{ ...themedStyles.formTitle, fontSize: 18, marginBottom: 12 }}>📊 Your Stats</h3>
                <p style={{ margin: '4px 0', fontSize: 14 }}>
                  💪 {workoutPrograms.length} Program{workoutPrograms.length !== 1 ? 's' : ''}
                </p>
                <p style={{ margin: '4px 0', fontSize: 14 }}>
                  🏋️ {excercises.length} Total Exercise{excercises.length !== 1 ? 's' : ''}
                </p>
                <p style={{ margin: '4px 0', fontSize: 14 }}>🏃 {unassignedExcercises.length} Standalone</p>
              </div>
            </div>
          )}
        </div>

        {/* Main content area with workout programs */}
        <div>
          {/* Nutrition Summary */}
          <NutritionSummary user={user} />

          {/* Workout Programs */}
          {workoutPrograms.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24, alignItems: 'flex-start' }}>
              {workoutPrograms.map((wp) => (
                <WorkoutProgramBoard
                  key={wp.id}
                  workoutProgram={wp}
                  excercises={excercises}
                  workoutPrograms={workoutPrograms}
                  onExcerciseUpdate={handleExcerciseUpdate}
                  onExcerciseDelete={handleExcerciseDelete}
                  onWorkoutProgramUpdate={handleWorkoutProgramUpdate}
                  onWorkoutProgramDelete={handleWorkoutProgramDelete}
                  user={user}
                />
              ))}
            </div>
          )}

          {/* Standalone Exercises */}
          {unassignedExcercises.length > 0 && (
            <div
              style={{
                ...themedStyles.excercise,
                borderLeft: `4px solid #6c757d`,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ ...themedStyles.excerciseName, margin: 0 }}>🏃 Standalone Exercises</h3>
                  <p style={{ ...themedStyles.excerciseDescription, margin: '4px 0' }}>Exercises not assigned to any program</p>
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
                    UNASSIGNED
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 14, color: themedStyles.excerciseDescription.color, marginBottom: 12 }}>
                🏋️ {unassignedExcercises.length} exercise{unassignedExcercises.length !== 1 ? 's' : ''}
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {unassignedExcercises.map((excercise) => (
                  <ExcerciseCard
                    key={excercise.id}
                    excercise={excercise}
                    onUpdate={handleExcerciseUpdate}
                    onDelete={handleExcerciseDelete}
                    user={user}
                    workoutPrograms={workoutPrograms}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {workoutPrograms.length === 0 && excercises.length === 0 && (
            <div style={themedStyles.emptyMessage}>
              <h3>💪 Start Your Fitness Journey!</h3>
              <p>Create your first workout program to organize your exercises</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuthenticator(App);
