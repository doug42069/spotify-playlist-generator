import { useEffect, useState } from 'react';
import LoginButton from './components/LoginButton';
import PlaylistForm from './components/PlaylistForm';
import PlaylistLink from './components/PlaylistLink';
import { loginWithPKCE, handleRedirect } from './utils/spotifyAuth';

const moodMap = {
  chill: "chill acoustic ambient",
  workout: "energetic workout upbeat",
  party: "party dance pop",
  focus: "focus instrumental study",
  romantic: "romantic love ballad",
  sad: "sad emotional mellow",
  happy: "happy upbeat joyful",
  "rainy day": "rainy mellow acoustic",
  "sunny vibes": "sunshine summer pop",
  "road trip": "road trip driving rock",
  study: "study focus instrumental",
  sleep: "sleep ambient calm",
  meditation: "meditation zen ambient",
  gaming: "gaming electronic synth",
  throwback: "retro 80s 90s",
  jazzy: "jazz smooth saxophone",
  classical: "classical orchestra piano",
  rock: "rock alternative grunge",
  "hip hop": "hip hop rap beats",
  country: "country acoustic americana",
  electronic: "electronic edm house",
  indie: "indie alternative folk",
  metal: "metal heavy rock",
  reggae: "reggae dub chill",
  funk: "funk groove bass",
  lofi: "lofi chill beats",
  instrumental: "instrumental ambient",
  relaxation: "relax calm peaceful",
  travel: "world global vibes",
  celebration: "celebration party upbeat",
  holiday: "holiday festive seasonal",
  spooky: "spooky halloween eerie",
  motivational: "motivational inspiring energetic",
  "deep focus": "deep focus ambient",
  nature: "nature sounds forest",
  kids: "kids fun singalong",
  cooking: "cooking jazz upbeat",
  cleaning: "cleaning energetic pop",
  "creative flow": "creative flow ambient"
};

function LoadingBar({ progress }) {
  return (
    <div style={{ width: '100%', background: '#111', height: 12, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ width: `${progress}%`, height: '100%', transition: 'width 300ms linear', background: '#1DB954' }} />
    </div>
  );
}

async function TrackUrisFromRecommendations(token, params = {}, limit = 20) {
  const qs = new URLSearchParams({ ...params, limit: Math.min(limit, 100) }).toString();
  const res = await fetch(`https://api.spotify.com/v1/recommendations?${qs}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks ? data.tracks.map(t => t.uri) : [];
}

async function TrackUrisFromSearch(token, query, limit = 20) {
  const qs = new URLSearchParams({ q: query, type: 'track', limit: Math.min(limit, 50) }).toString();
  const res = await fetch(`https://api.spotify.com/v1/search?${qs}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks ? data.tracks.items.map(t => t.uri) : [];
}

async function createPlaylistAndAddTracks(token, userId, name, uris) {
  const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, public: false, description: 'Generated with Spotify Playlist Generator' })
  });
  if (!createRes.ok) throw new Error('Failed to create playlist');
  const playlist = await createRes.json();

  if (uris.length > 0) {
    await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris })
    });
  }
  return playlist;
}

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const token = await handleRedirect();
        const stored = token || localStorage.getItem('access_token');
        if (stored) {
          setAccessToken(stored);
          setLoggedIn(true);
          const me = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (me.ok) {
            const meJson = await me.json();
            setUserName(meJson.display_name || meJson.id || '');
            setUserId(meJson.id || '');
          }
        }
      } catch (err) {
        console.error('Error on auth init:', err);
      }
    })();
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    setAccessToken(null);
    setLoggedIn(false);
    setUserName('');
    setUserId('');
    setPlaylistUrl('');
    setPlaylistName('');
  }

  async function generatePlaylist({ mode, mood, genre, artist, title, count = 20 }) {
    if (!accessToken) return alert('Please login to Spotify first.');
    setLoading(true);
    setProgress(5);

    try {
      let currentUserId = userId;
      if (!currentUserId) {
        setProgress(15);
        const me = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } });
        const meJson = await me.json();
        currentUserId = meJson.id;
        setUserName(meJson.display_name || meJson.id || '');
        setUserId(currentUserId);
      }

      let uris = [];
      const desired = Math.min(Math.max(Number(count) || 20, 1), 50);

      if (mode === 'genre') {
        setProgress(30);
        const seed = genre.toLowerCase();
        uris = await TrackUrisFromRecommendations(accessToken, { seed_genres: seed }, desired);
        if (uris.length === 0) {
          uris = await TrackUrisFromSearch(accessToken, seed, desired);
        }
      } else if (mode === 'artist') {
        setProgress(40);
        const qs = new URLSearchParams({ q: artist, type: 'artist', limit: 1 }).toString();
        const res = await fetch(`https://api.spotify.com/v1/search?${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        const artistObj = data.artists?.items?.[0];
        if (!artistObj) throw new Error('Artist not found');
        const artistId = artistObj.id;
        const topRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const topData = await topRes.json();
        uris = (topData.tracks || []).map((t) => t.uri);
        if (uris.length < desired) {
          const more = await TrackUrisFromRecommendations(accessToken, { seed_artists: artistId }, desired - uris.length);
          uris = uris.concat(more).slice(0, desired);
        }
      } else {
        setProgress(40);
        const keywords = moodMap[mood] || mood;
        uris = await TrackUrisFromSearch(accessToken, keywords, desired);
        if (uris.length < desired) {
          const seedGenres = keywords.split(' ').slice(0, 2).join(',');
          const recs = await TrackUrisFromRecommendations(accessToken, { seed_genres: seedGenres }, desired - uris.length);
          uris = uris.concat(recs).slice(0, desired);
        }
      }

      if (!uris.length) throw new Error('No tracks found.');

      setProgress(75);
      const finalName = title || (mode === 'genre' ? `Genre: ${genre}` : mode === 'artist' ? `Artist: ${artist}` : `Mood: ${mood}`);
      const playlist = await createPlaylistAndAddTracks(accessToken, currentUserId, finalName, uris);

      setPlaylistUrl(playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`);
      setPlaylistName(finalName);
      setProgress(100);
      setTimeout(() => { setLoading(false); setProgress(0); }, 600);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setProgress(0);
      alert('Error: ' + (err.message || err));
    }
  }
  if (!loggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="slogo.png"
            alt="Spotify Logo"
            style={{
              width: 150,
              marginBottom: 24
            }}
          />
          <h1 style={{ marginBottom: 8 }}>Spotify Playlist Generator</h1>
          <p style={{ color: '#bbb', marginBottom: 20 }}>Login with Spotify to create mood, genre, or artist-based playlists.</p>
          <LoginButton onClick={() => loginWithPKCE()}>Login with Spotify</LoginButton>
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Spotify Playlist Generator</h1>
        <div style={{ textAlign: 'right' }}>
          <div>Signed in as <strong>{userName}</strong></div>
          <button onClick={handleLogout} style={{
            background: '#e63946',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            marginTop: 6
          }}>Logout</button>
        </div>
      </div>

      {loading && (
        <div style={{ marginTop: 20 }}>
          <LoadingBar progress={progress} />
          <div style={{ color: '#666', fontSize: 14, marginTop: 8 }}>{Math.round(progress)}%</div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <PlaylistForm onSubmit={generatePlaylist} />
        <div style={{ marginTop: 20 }}>
          <PlaylistLink url={playlistUrl} name={playlistName} />
        </div>
      </div>
    </div>
  );
}

export default App;