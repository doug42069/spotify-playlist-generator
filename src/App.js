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
  const actualLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const qs = new URLSearchParams({ ...params, limit: actualLimit }).toString();
  try {
    const res = await fetch(`https://api.spotify.com/v1/recommendations?${qs}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.tracks) return [];
    return (data.tracks || []).slice(0, actualLimit).map(t => t.uri);
  } catch {
    return [];
  }
}

async function TrackUrisFromSearch(token, query, limit = 20) {
  const actualLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const qs = new URLSearchParams({ q: query, type: 'track', limit: actualLimit }).toString();
  try {
    const res = await fetch(`https://api.spotify.com/v1/search?${qs}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.tracks) return [];
    return (data.tracks.items || []).slice(0, actualLimit).map(t => t.uri);
  } catch {
    return [];
  }
}

async function createPlaylistAndAddTracks(token, userId, name, uris) {
  const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, public: false, description: 'Generated with Spotify Playlist Generator' })
  });
  if (!createRes.ok) throw new Error('Failed to create playlist');
  const playlist = await createRes.json();
  const uniqueUris = Array.from(new Set(uris));
  const BATCH = 100;
  for (let i = 0; i < uniqueUris.length; i += BATCH) {
    const batch = uniqueUris.slice(i, i + BATCH);
    await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: batch })
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
          const me = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${stored}` } });
          if (me.ok) {
            const meJson = await me.json();
            setUserName(meJson.display_name || meJson.id || '');
            setUserId(meJson.id || '');
          }
        }
      } catch {}
    })();
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    setAccessToken(null);
    setLoggedIn(false);
    setUserName('');
    setUserId('');
  }

  async function generatePlaylist({ mood, genre, artist, mode, desired }) {
    if (!accessToken || !userId) return;
    setLoading(true);
    setProgress(10);
    let uris = [];
    try {
      if (mode === 'mood') {
        const moodQuery = moodMap[mood] || mood;
        uris = await TrackUrisFromSearch(accessToken, moodQuery, desired);
      } else if (mode === 'genre') {
        const genreQuery = genre.toLowerCase().replace(/\s+/g, '-');
        uris = await TrackUrisFromRecommendations(accessToken, { seed_genres: genreQuery }, desired);
        if (uris.length < desired) {
          const more = await TrackUrisFromSearch(accessToken, genre, desired - uris.length);
          uris = uris.concat(more).slice(0, desired);
        }
      } else if (mode === 'artist') {
        setProgress(35);
        const qs = new URLSearchParams({ q: artist, type: 'artist', limit: 1 }).toString();
        const res = await fetch(`https://api.spotify.com/v1/search?${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) throw new Error('Artist search failed');
        const data = await res.json();
        const artistObj = data.artists?.items?.[0];
        if (!artistObj) throw new Error('Artist not found');
        const artistId = artistObj.id;
        const artistGenres = (artistObj.genres || []).slice(0, 2);
        setProgress(50);
        const topRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (topRes.ok) {
          const topData = await topRes.json();
          uris = (topData.tracks || []).map(t => t.uri).slice(0, desired);
        }
        if (uris.length < desired) {
          const need = desired - uris.length;
          const params = { seed_artists: artistId };
          if (artistGenres.length > 0) params.seed_genres = artistGenres.join(',');
          const more = await TrackUrisFromRecommendations(accessToken, params, need);
          const setUris = new Set(uris);
          for (const u of more) {
            if (setUris.size >= desired) break;
            if (!setUris.has(u)) setUris.add(u);
          }
          uris = Array.from(setUris).slice(0, desired);
        }
        setProgress(75);
      }
      const finalUris = uris.slice(0, desired);
      const playlist = await createPlaylistAndAddTracks(accessToken, userId, playlistName || 'My Generated Playlist', finalUris);
      setPlaylistUrl(playlist.external_urls.spotify);
      setProgress(100);
    } catch (err) {
      console.error('Error generating playlist:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!loggedIn) {
    return (
      <div style={{ backgroundColor: 'black', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/slogo.jpg" alt="Spotify Logo" style={{ width: 120, marginBottom: 40 }} />
        <LoginButton onClick={loginWithPKCE} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {userName}</h2>
        <button onClick={handleLogout} style={{ background: '#1DB954', border: 'none', borderRadius: 20, padding: '10px 20px', color: 'white', cursor: 'pointer' }}>Logout</button>
      </div>
      <PlaylistForm onGenerate={generatePlaylist} setPlaylistName={setPlaylistName} loading={loading} />
      {loading && <LoadingBar progress={progress} />}
      {playlistUrl && <PlaylistLink url={playlistUrl} />}
    </div>
  );
}

export default App;