import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { record } from 'aws-amplify/analytics/kinesis';
import { getRandomEmoji, getKinesisEvents } from '../graphql/queries';

const STREAM_NAME = 'app6Kinesis-main';

type KinesisEvent = {
  data: string | null;
  sequenceNumber: string | null;
  timestamp: string | null;
};

type KinesisResponse = {
  streamName: string | null;
  shardId: string | null;
  events: KinesisEvent[] | null;
  error: string | null;
};

export default function SurpriseMeButton() {
  const client = generateClient();
  const [emoji, setEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kinesisData, setKinesisData] = useState<KinesisResponse | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  async function handleClick() {
    setLoading(true);

    const eventData = {
      event: 'surpriseMeClicked',
      timestamp: Date.now(),
    };

    try {
      record({
        data: eventData,
        partitionKey: 'surpriseMe',
        streamName: STREAM_NAME,
      });
    } catch (analyticsErr) {
      console.warn('Analytics error:', analyticsErr);
    }

    try {
      const result = await client.graphql({
        query: getRandomEmoji,
        authMode: 'userPool',
      });
      setEmoji(result.data.getRandomEmoji || '🎉');
    } catch (err) {
      console.error('Error getting emoji:', err);
      setEmoji('🎉');
    }
    setLoading(false);
  }

  async function handleViewEvents() {
    setLoadingEvents(true);
    try {
      const result = await client.graphql({
        query: getKinesisEvents,
        authMode: 'userPool',
      });
      const data =
        typeof result.data.getKinesisEvents === 'string' ? JSON.parse(result.data.getKinesisEvents) : result.data.getKinesisEvents;
      setKinesisData(data as KinesisResponse);
    } catch (err) {
      console.error('Error fetching Kinesis events:', err);
    }
    setLoadingEvents(false);
  }

  return (
    <div className="surprise-section">
      <button onClick={handleClick} disabled={loading} className="surprise-btn">
        {loading ? '✨ Loading...' : '✨ Surprise Me!'}
      </button>
      {emoji && <div className="emoji-display">{emoji}</div>}

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleViewEvents} disabled={loadingEvents} className="btn btn-secondary">
          {loadingEvents ? '📊 Loading...' : '📊 View Kinesis Events'}
        </button>
      </div>

      {kinesisData && (
        <div className="kinesis-events-panel">
          <div className="kinesis-events-header">
            <span>📊 Kinesis Stream: {kinesisData.streamName}</span>
            <button className="panel-close" onClick={() => setKinesisData(null)}>
              ×
            </button>
          </div>
          {kinesisData.error ? (
            <div className="kinesis-error">Error: {kinesisData.error}</div>
          ) : (
            <>
              <div className="kinesis-meta">Shard: {kinesisData.shardId}</div>
              <div className="kinesis-events-list">
                {kinesisData.events && kinesisData.events.length > 0 ? (
                  kinesisData.events.map((event, i) => (
                    <div key={i} className="kinesis-event-item">
                      <div className="event-seq">#{event.sequenceNumber?.slice(-8)}</div>
                      <div className="event-data">{event.data}</div>
                      <div className="event-ts">{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '-'}</div>
                    </div>
                  ))
                ) : (
                  <div className="kinesis-empty">No events found in stream</div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
