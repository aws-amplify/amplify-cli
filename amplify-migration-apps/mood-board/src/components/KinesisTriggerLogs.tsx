import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const listKinesisEventCounts = /* GraphQL */ `
  query ListKinesisEventCounts($filter: ModelKinesisEventCountFilterInput, $limit: Int, $nextToken: String) {
    listKinesisEventCounts(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        processedAt
      }
      nextToken
    }
  }
`;

type EventEntry = { id: string; processedAt: string };

const WINDOWS = [
  { label: 'Last 1 hour', hours: 1 },
  { label: 'Last 6 hours', hours: 6 },
  { label: 'Last 12 hours', hours: 12 },
  { label: 'Last 24 hours', hours: 24 },
];

export default function KinesisTriggerLogs() {
  const [counts, setCounts] = useState<Record<number, number> | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchAll() {
    setLoading(true);
    try {
      // Fetch all events from the last 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const items: EventEntry[] = [];
      let nextToken: string | null = null;

      do {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await client.graphql({
          query: listKinesisEventCounts,
          variables: {
            filter: { processedAt: { ge: since } },
            limit: 1000,
            ...(nextToken ? { nextToken } : {}),
          },
        });
        items.push(...result.data.listKinesisEventCounts.items);
        nextToken = result.data.listKinesisEventCounts.nextToken;
      } while (nextToken);

      // Bucket by time window
      const now = Date.now();
      const result: Record<number, number> = {};
      for (const w of WINDOWS) {
        const cutoff = now - w.hours * 60 * 60 * 1000;
        result[w.hours] = items.filter((e) => new Date(e.processedAt).getTime() >= cutoff).length;
      }
      setCounts(result);
    } catch (err) {
      console.error('Error fetching event counts:', err);
    }
    setLoading(false);
  }

  return (
    <div style={{ margin: '20px 0', textAlign: 'center' }}>
      <button onClick={fetchAll} disabled={loading} className="btn btn-secondary">
        {loading ? '🔄 Loading...' : '📊 View Stream Analytics'}
      </button>
      {counts !== null && (
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {WINDOWS.map((w) => (
            <div key={w.hours} style={{ padding: '10px 16px', background: '#f0f0f0', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85em', color: '#666' }}>{w.label}</div>
              <div style={{ fontSize: '1.4em', fontWeight: 'bold' }}>{counts[w.hours]}</div>
              <div style={{ fontSize: '0.75em', color: '#999' }}>events</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
