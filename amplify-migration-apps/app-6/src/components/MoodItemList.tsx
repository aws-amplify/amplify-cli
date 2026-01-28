import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { listMoodItems, moodItemsByBoardID, listBoards } from '../graphql/queries';
import { createMoodItem, deleteMoodItem } from '../graphql/mutations';
import type { MoodItem, Board } from '../API';

interface MoodItemListProps {
  selectedBoardId: string | null;
}

export default function MoodItemList({ selectedBoardId }: MoodItemListProps) {
  const client = generateClient();
  const [moodItems, setMoodItems] = useState<MoodItem[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [boardID, setBoardID] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMoodItems();
    fetchBoards();
  }, [selectedBoardId]);

  async function fetchBoards() {
    try {
      const result = await client.graphql({ query: listBoards });
      setBoards((result.data.listBoards?.items || []) as Board[]);
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  }

  async function fetchMoodItems() {
    setLoading(true);
    try {
      let items: MoodItem[];
      if (selectedBoardId) {
        const result = await client.graphql({
          query: moodItemsByBoardID,
          variables: { boardID: selectedBoardId },
        });
        items = (result.data.moodItemsByBoardID?.items || []) as MoodItem[];
      } else {
        const result = await client.graphql({ query: listMoodItems });
        items = (result.data.listMoodItems?.items || []) as MoodItem[];
      }
      setMoodItems(items);

      const urlPromises = items
        .filter((item) => item.image)
        .map(async (item) => {
          try {
            const urlResult = await getUrl({ path: item.image! });
            return { id: item.id, url: urlResult.url.toString() };
          } catch (err) {
            console.error('Error getting image URL:', err);
            return null;
          }
        });
      const urlResults = await Promise.all(urlPromises);
      const urls: Record<string, string> = {};
      urlResults.forEach((result) => {
        if (result) urls[result.id] = result.url;
      });
      setImageUrls(urls);
    } catch (err) {
      console.error('Error fetching mood items:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMoodItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !imageFile || !boardID) return;

    try {
      const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `public/images/${Date.now()}-${sanitizedName}`;
      await uploadData({ path: key, data: imageFile }).result;
      const imagePath = key;

      await client.graphql({
        query: createMoodItem,
        variables: {
          input: {
            title: title.trim(),
            description: description.trim() || null,
            boardID: boardID,
            image: imagePath,
          },
        },
      });
      setTitle('');
      setDescription('');
      setBoardID('');
      setImageFile(null);
      setShowModal(false);
      fetchMoodItems();
    } catch (err) {
      console.error('Error creating mood item:', err);
    }
  }

  async function handleDeleteMoodItem(id: string, imagePath: string | null | undefined) {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      if (imagePath) {
        try {
          await remove({ path: imagePath });
        } catch (storageErr) {
          console.warn('Could not delete image:', storageErr);
        }
      }
      await client.graphql({
        query: deleteMoodItem,
        variables: { input: { id } },
      });
      fetchMoodItems();
    } catch (err) {
      console.error('Error deleting mood item:', err);
    }
  }

  if (loading) return <div className="loading">Loading mood items...</div>;

  return (
    <div className="items-section">
      <div className="section-header">
        <h2>💡 Mood Items</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Item
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Item</h3>
              <button className="panel-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateMoodItem} className="modal-form">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" required />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
              <select value={boardID} onChange={(e) => setBoardID(e.target.value)} required>
                <option value="">Select board *</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
              <div className="file-upload-wrapper">
                <label className={`file-upload-btn ${imageFile ? 'has-file' : ''}`}>
                  📷 {imageFile ? imageFile.name : 'Choose Image *'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="file-upload-input"
                    required
                  />
                </label>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Item
              </button>
            </form>
          </div>
        </div>
      )}

      {moodItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎨</div>
          <p>No mood items yet. Click "Add Item" to get started!</p>
        </div>
      ) : (
        <div className="mood-grid">
          {moodItems.map((item) => (
            <div key={item.id} className="mood-card">
              <button onClick={() => handleDeleteMoodItem(item.id, item.image)} className="mood-card-delete" title="Delete item">
                ×
              </button>
              {imageUrls[item.id] && <img src={imageUrls[item.id]} alt={item.title} className="mood-card-image" />}
              <div className="mood-card-content">
                <h3 className="mood-card-title">{item.title}</h3>
                {item.description && <p className="mood-card-description">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
