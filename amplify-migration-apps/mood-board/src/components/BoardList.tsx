import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listBoards } from '../graphql/queries';
import { createBoard, deleteBoard } from '../graphql/mutations';
import type { Board } from '../API';

interface BoardListProps {
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string | null) => void;
}

export default function BoardList({ selectedBoardId, onSelectBoard }: BoardListProps) {
  const client = generateClient();
  const [boards, setBoards] = useState<Board[]>([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const result = await client.graphql({ query: listBoards });
      setBoards((result.data.listBoards?.items || []) as Board[]);
    } catch (err) {
      console.error('Error fetching boards:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      await client.graphql({
        query: createBoard,
        variables: { input: { name: newBoardName.trim() } },
      });
      setNewBoardName('');
      setShowModal(false);
      fetchBoards();
    } catch (err) {
      console.error('Error creating board:', err);
    }
  }

  async function handleDeleteBoard(id: string) {
    if (!window.confirm('Are you sure you want to delete this board?')) return;

    try {
      await client.graphql({
        query: deleteBoard,
        variables: { input: { id } },
      });
      if (selectedBoardId === id) {
        onSelectBoard(null);
      }
      fetchBoards();
    } catch (err) {
      console.error('Error deleting board:', err);
    }
  }

  if (loading) return <div className="loading">Loading boards...</div>;

  return (
    <div className="boards-section">
      <div className="section-header">
        <h2>📋 Boards</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Board
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Board</h3>
              <button className="panel-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBoard} className="modal-form">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name *"
                required
                autoFocus
              />
              <button type="submit" className="btn btn-primary">
                Add Board
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="board-tabs">
        <button
          onClick={() => onSelectBoard(null)}
          className={`btn ${selectedBoardId === null ? 'btn-secondary active' : 'btn-secondary'}`}
        >
          All Items
        </button>
        {boards.map((board) => (
          <div key={board.id} className="board-tab">
            <button
              onClick={() => onSelectBoard(board.id)}
              className={`btn ${selectedBoardId === board.id ? 'btn-secondary active' : 'btn-secondary'}`}
            >
              {board.name}
            </button>
            <button onClick={() => handleDeleteBoard(board.id)} className="board-delete-btn" title="Delete board">
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
