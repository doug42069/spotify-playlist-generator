import { useState } from 'react';

const moodOptions = [
  "chill", "workout", "party", "focus", "romantic", "sad", "happy", "rainy day", "sunny vibes",
  "road trip", "study", "sleep", "meditation", "gaming", "throwback", "jazzy", "classical",
  "rock", "hip hop", "country", "electronic", "indie", "metal", "reggae", "funk", "lofi",
  "instrumental", "relaxation", "travel", "celebration", "holiday", "spooky", "motivational",
  "deep focus", "nature", "kids", "cooking", "cleaning", "creative flow"
];

export default function PlaylistForm({ onSubmit }) {
  const [mood, setMood] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [songCount, setSongCount] = useState(20);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ mood, playlistName, songCount });
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      backgroundColor: '#f9f9f9',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <label style={{ fontWeight: 'bold' }}>
        Mood:
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          required
          style={{ padding: '10px', marginTop: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="">--Choose one--</option>
          {moodOptions.map((m) => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
      </label>

      <label style={{ fontWeight: 'bold' }}>
        Playlist Name:
        <input
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          required
          style={{ padding: '10px', marginTop: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
      </label>

      <label style={{ fontWeight: 'bold' }}>
        Number of Songs:
        <input
          type="range"
          min="1"
          max="50"
          value={songCount}
          onChange={(e) => setSongCount(e.target.value)}
          style={{ width: '100%' }}
        />
        <span>{songCount} songs</span>
      </label>

      <button type="submit" style={{
        padding: '12px',
        backgroundColor: '#1DB954',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        Generate Playlist
      </button>
    </form>
  );
}
