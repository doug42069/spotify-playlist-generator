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
  if (!createRes.ok) {
    const txt = await createRes.text().catch(() => null);
    throw new Error('Failed to create playlist: ' + (txt || createRes.status));
  }
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
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setLoggedIn(false);
    setUserName('');
    setUserId('');
    setPlaylistUrl('');
    setPlaylistName('');
  }

  async function generatePlaylist({ mode, mood, genre, artist, title, count }) {
    if (!accessToken) return alert('Please login to Spotify first.');
    setLoading(true);
    setProgress(5);

    try {
      let currentUserId = userId;
      if (!currentUserId) {
        setProgress(12);
        const me = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!me.ok) throw new Error('Failed fetching profile');
        const meJson = await me.json();
        currentUserId = meJson.id;
        setUserName(meJson.display_name || meJson.id || '');
        setUserId(currentUserId);
      }

      const desired = Math.min(Math.max(Number(count) || 20, 1), 50);
      let uris = [];

      if (mode === 'genre') {
        setProgress(30);
        const seed = String(genre).toLowerCase().replace(/\s+/g, '-');
        uris = await TrackUrisFromRecommendations(accessToken, { seed_genres: seed }, desired);
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

      const topRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, { headers: { Authorization: `Bearer ${accessToken}` } });
        let uris = [];
        if (topRes.ok) {
          const topData = await topRes.json();
          uris = (topData.tracks || []).map(t => t.uri);
        }

        if (uris.length < desired) {
          const need = desired - uris.length;
          const params = { seed_artists: artistId };
          if (artistGenres.length > 0) params.seed_genres = artistGenres.join(',');

      const recs = await TrackUrisFromRecommendations(accessToken, params, need * 2); 
      const setUris = new Set(uris);
          for (const u of recs) {
          if (setUris.size >= desired) break;
          setUris.add(u);
        }
          uris = Array.from(setUris).slice(0, desired);
        }

        if (uris.length < desired) {
        const fallback = await TrackUrisFromSearch(accessToken, artist, desired - uris.length);
        const setUris = new Set(uris.concat(fallback));
        uris = Array.from(setUris).slice(0, desired);
      }

  setProgress(75);
      } else {
        setProgress(30);
        const keywords = (moodMap[mood] || mood || '').trim();
        uris = await TrackUrisFromSearch(accessToken, keywords, desired);
        if (uris.length < desired) {
          const seedGenres = keywords.split(' ').slice(0, 2).join(',');
          const recs = await TrackUrisFromRecommendations(accessToken, { seed_genres: seedGenres }, desired - uris.length);
          uris = uris.concat(recs).slice(0, desired);
        }
        setProgress(65);
      }

      if (!uris || uris.length === 0) throw new Error('No tracks found for that selection.');

      const finalName = title || (mode === 'genre' ? `Genre: ${genre}` : mode === 'artist' ? `Artist: ${artist}` : `Mood: ${mood}`);
      setProgress(80);
      const playlist = await createPlaylistAndAddTracks(accessToken, currentUserId, finalName, uris);
      setProgress(95);

      setPlaylistUrl(playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`);
      setPlaylistName(finalName);
      setProgress(100);
      setTimeout(() => { setLoading(false); setProgress(0); }, 500);

    } catch (err) {
      console.error(err);
      setLoading(false);
      setProgress(0);
      alert('Error creating playlist: ' + (err.message || err));
    }
  }

  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 20 }}>
          <div style={{ marginBottom: 24 }}>
            <img src="slogo.jpg" alt="logo" style={{ width: 150 }} />
          </div>

          <h1 style={{ color: '#fff', marginBottom: 8 }}>Spotify Playlist Generator</h1>
          <p style={{ color: '#ddd' }}>Login to Spotify to create playlists from moods, genres, or artists.</p>

          <div style={{ marginTop: 20 }}>
            <LoginButton onClick={() => loginWithPKCE()}>Login with Spotify</LoginButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Spotify Playlist Generator</h1>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14 }}>Signed in as <strong>{userName || 'Unknown'}</strong></div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: '#e63946',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        {loading && (
          <div style={{ marginBottom: 12 }}>
            <LoadingBar progress={progress} />
            <div style={{ marginTop: 8 }}>{Math.round(progress)}%</div>
          </div>
        )}

        <PlaylistForm onSubmit={generatePlaylist} />
        <div style={{ marginTop: 20 }}>
          <PlaylistLink url={playlistUrl} name={playlistName} />
        </div>
      </div>
    </div>
  );
}

export default App;