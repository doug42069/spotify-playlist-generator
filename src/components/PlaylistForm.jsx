import { useState } from 'react';

const moodOptions = [
  "chill", "workout", "party", "focus", "romantic", "sad", "happy", "rainy day", "sunny vibes",
  "road trip", "study", "sleep", "meditation", "gaming", "throwback", "jazzy", "classical",
  "rock", "hip hop", "country", "electronic", "indie", "metal", "reggae", "funk", "lofi",
  "instrumental", "relaxation", "travel", "celebration", "holiday", "spooky", "motivational",
  "deep focus", "nature", "kids", "cooking", "cleaning", "creative flow"
];

const genreOptions = [
  { label: "Acoustic", value: "acoustic" },
  { label: "Afrobeat", value: "afrobeat" },
  { label: "Alt-Rock", value: "alt-rock" },
  { label: "Classical", value: "classical" },
  { label: "Country", value: "country" },
  { label: "Dance", value: "dance" },
  { label: "Deep-House", value: "deep-house" },
  { label: "Disco", value: "disco" },
  { label: "EDM", value: "edm" },
  { label: "Electronic", value: "electronic" },
  { label: "Hip-Hop", value: "hip-hop" },
  { label: "Jazz", value: "jazz" },
  { label: "Metal", value: "metal" },
  { label: "Pop", value: "pop" },
  { label: "Punk", value: "punk" },
  { label: "Rap", value: "rap" },
  { label: "Reggae", value: "reggae" },
  { label: "Rock", value: "rock" },
  { label: "Soul", value: "soul" },
  { label: "Trap", value: "trap" },
  { label: "Trip-Hop", value: "trip-hop" }
];

export default function PlaylistForm({ onSubmit }) {
  const [mode, setMode] = useState('mood');
  const [mood, setMood] = useState('');
  const [genre, setGenre] = useState(genreOptions[0].value);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [count, setCount] = useState(20);

  function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'mood' && !mood) return alert('Please choose a mood');
    if (mode === 'artist' && !artist.trim()) return alert('Please enter an artist name');
    if (mode === 'genre' && !genre) return alert('Please choose a genre');
    
    const payload = {
      mode,
      mood,
      genre,
      artist: artist.trim(),
      title: title.trim() || undefined,
      count: Number(count) || 20
    };
    onSubmit(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#121212',
        color: '#fff',
        padding: '24px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 20, color: '#1DB954' }}>
        🎵 Generate a Spotify Playlist
      </h2>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        {['mood', 'genre', 'artist'].map((m) => (
          <label key={m} style={{ margin: '0 8px', cursor: 'pointer' }}>
            <input
              type="radio"
              name="mode"
              value={m}
              checked={mode === m}
              onChange={() => setMode(m)}
              style={{ marginRight: 6 }}
            />
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Playlist title (optional)</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. My Vibe Mix"
          style={{
            padding: 10,
            width: '100%',
            borderRadius: 6,
            border: '1px solid #333',
            backgroundColor: '#181818',
            color: 'white'
          }}
        />
      </div>

      {mode === 'mood' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Mood</label>
          <select
            value={mood}
            onChange={e => setMood(e.target.value)}
            style={{
              padding: 10,
              width: '100%',
              borderRadius: 6,
              border: '1px solid #333',
              backgroundColor: '#181818',
              color: 'white'
            }}
          >
            <option value="">-- choose a mood --</option>
            {moodOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {mode === 'genre' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Genre</label>
          <select
            value={genre}
            onChange={e => setGenre(e.target.value)}
            style={{
              padding: 10,
              width: '100%',
              borderRadius: 6,
              border: '1px solid #333',
              backgroundColor: '#181818',
              color: 'white'
            }}
          >
            {genreOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
      )}

      {mode === 'artist' && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Artist name</label>
          <input
            value={artist}
            onChange={e => setArtist(e.target.value)}
            placeholder="e.g. Childish Gambino"
            style={{
              padding: 10,
              width: '100%',
              borderRadius: 6,
              border: '1px solid #333',
              backgroundColor: '#181818',
              color: 'white'
            }}
          />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6 }}>Number of songs: {count}</label>
        <input
          type="range"
          min="1"
          max="50"
          value={count}
          onChange={e => setCount(e.target.value)}
          style={{
            width: '100%',
            accentColor: '#1DB954'
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#1DB954',
          color: '#fff',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background 0.3s'
        }}
        onMouseOver={e => (e.target.style.backgroundColor = '#1ed760')}
        onMouseOut={e => (e.target.style.backgroundColor = '#1DB954')}
      >
        Generate Playlist
      </button>
    </form>
  );
}
