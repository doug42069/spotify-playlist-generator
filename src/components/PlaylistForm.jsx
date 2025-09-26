import { useState } from 'react';

export default function PlaylistForm({ onSubmit }) {
  const [mood, setMood] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [songCount, setSongCount] = useState(20);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ mood, playlistName, songCount });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Mood:
        <select value={mood} onChange={(e) => setMood(e.target.value)} required>
          <option value="">--Choose one--</option>
          <option value="chill">Chill</option>
          <option value="workout">Workout</option>
          <option value="party">Party</option>
          <option value="focus">Focus</option>
        </select>
      </label>

      <label>
        Playlist Name:
        <input
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          required
        />
      </label>

      <label>
        Number of Songs:
        <input
          type="range"
          min="1"
          max="50"
          value={songCount}
          onChange={(e) => setSongCount(e.target.value)}
        />
        <span>{songCount} songs</span>
      </label>

      <button type="submit">Generate Playlist</button>
    </form>
  );
}
