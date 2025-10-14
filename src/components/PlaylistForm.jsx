import { useState } from 'react';

const moodOptions = [
  "chill", "workout", "party", "focus", "romantic", "sad", "happy", "rainy day", "sunny vibes",
  "road trip", "study", "sleep", "meditation", "gaming", "throwback", "jazzy", "classical",
  "rock", "hip hop", "country", "electronic", "indie", "metal", "reggae", "funk", "lofi",
  "instrumental", "relaxation", "travel", "celebration", "holiday", "spooky", "motivational",
  "deep focus", "nature", "kids", "cooking", "cleaning", "creative flow"
];

const genreOptions = [
  "pop","rock","hip-hop","indie","electronic","dance","jazz","classical","blues","country",
  "reggae","metal","folk","soul","r&b","latin","punk","funk","ambient","k-pop","disco"
];

export default function PlaylistForm({ onSubmit }) {
  const [mode, setMode] = useState('mood'); // 'mood' | 'genre' | 'artist'
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState(genreOptions[0]);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'mood' && !mood) return alert('Please choose a mood');
    if (mode === 'artist' && !artist.trim()) return alert('Please enter an artist name');
    if (mode === 'genre' && !genre) return alert('Please choose a genre');
    const payload = { mode, mood, genre, artist: artist.trim(), title: title.trim() || undefined };
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <div>
        <label style={{ marginRight: 8 }}><strong>Type</strong></label>
        <label style={{ marginRight: 8 }}>
          <input type="radio" name="mode" value="mood" checked={mode==='mood'} onChange={()=>setMode('mood')} /> Mood
        </label>
        <label style={{ marginRight: 8 }}>
          <input type="radio" name="mode" value="genre" checked={mode==='genre'} onChange={()=>setMode('genre')} /> Genre
        </label>
        <label>
          <input type="radio" name="mode" value="artist" checked={mode==='artist'} onChange={()=>setMode('artist')} /> Artist
        </label>
      </div>

      <div>
        <label style={{ display: 'block', fontWeight: 'bold' }}>Playlist title (optional)</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. My Chill Mix" style={{ padding: 8, width: '100%' }} />
      </div>

      {mode === 'mood' && (
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Mood</label>
          <select value={mood} onChange={e=>setMood(e.target.value)} style={{ padding: 8, width: '100%' }}>
            <option value="">-- choose a mood --</option>
            {moodOptions.map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {mode === 'genre' && (
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Genre</label>
          <select value={genre} onChange={e=>setGenre(e.target.value)} style={{ padding: 8, width: '100%' }}>
            {genreOptions.map(g=> <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      )}

      {mode === 'artist' && (
        <div>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Artist name</label>
          <input value={artist} onChange={e=>setArtist(e.target.value)} placeholder="e.g. Tame Impala" style={{ padding: 8, width: '100%' }} />
        </div>
      )}

      <div>
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
      </div>
    </form>
  );
}
