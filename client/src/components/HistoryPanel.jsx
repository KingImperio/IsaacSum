export default function HistoryPanel({ items, loading, onOpen, onDelete }) {
  if (loading) return <div className="empty">Loading history...</div>;
  if (!items?.length) return <div className="empty">No saved summaries yet.</div>;

  return (
    <div className="history-list">
      {items.map((item) => (
        <div key={item.id} className="history-item">
          <div className="history-main" onClick={() => onOpen(item)}>
            <div className="history-title">
              {item.source?.filename || 'Pasted text'}
            </div>
            <div className="history-meta">
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''} •{' '}
              {item.options?.length} • {item.options?.format}
            </div>
            <div className="history-preview">{item.preview}...</div>
          </div>
          <button
            className="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
