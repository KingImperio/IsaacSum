export default function OptionsBar({ options, onChange }) {
  function set(key, value) {
    onChange({ ...options, [key]: value });
  }

  return (
    <div className="options">
      <label>
        Length
        <select value={options.length} onChange={(e) => set('length', e.target.value)}>
          <option value="concise">Concise (120-180 words)</option>
          <option value="balanced">Balanced (250-350 words)</option>
          <option value="detailed">Detailed (450-600 words)</option>
        </select>
      </label>
      <label>
        Format
        <select value={options.format} onChange={(e) => set('format', e.target.value)}>
          <option value="bullets">Bullet points</option>
          <option value="paragraphs">Paragraphs</option>
        </select>
      </label>
    </div>
  );
}
