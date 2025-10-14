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
    <div style={{ width: '100%', background: '#eee', height: 12, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ width: `${progress}%`, height: '100%', transition: 'width 300ms linear', background: '#1DB954' }} />
    </div>
  );
}

function TrackUrisFromRecommendations(token, params) {
  const qs = new URLSearchParams({ ...params, limit: 20 }).toString();
  return fetch(`https://api.spotify.com/v1/recommendations?${qs}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r=>r.json()).then(data => {
    if (!data.tracks) return [];
    return data.tracks.map(t => t.uri);
  });
}

function TrackUrisFromSearch(token, query) {
  const qs = new URLSearchParams({ q: query, type: 'track', limit: 20 }).toString();
  return fetch(`https://api.spotify.com/v1/search?${qs}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r=>r.json()).then(data => {
    if (!data.tracks) return [];
    return data.tracks.items.map(t => t.uri);
  });
}

async function createPlaylistAndAddTracks(token, userId, name, uris) {
  const createRes = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, public: false, description: 'Generated with Spotify Playlist Generator' })
  });
  const playlist = await createRes.json();
  await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris })
  });
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

  useEffect(()=>{
    (async ()=>{
      try {
        const token = await handleRedirect();
        const stored = token || localStorage.getItem('access_token');
        if (stored) {
          setAccessToken(stored);
          setLoggedIn(true);
          const me = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${stored}` } });
          const meJson = await me.json();
          setUserName(meJson.display_name || meJson.id || '');
          setUserId(meJson.id || '');
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

  async function generatePlaylist({ mode, mood, genre, artist, title }) {
    if (!accessToken) return alert('Please login to Spotify first.');
    setLoading(true);
    setProgress(5);

    try {
      let currentUserId = userId;
      if (!currentUserId) {
        setProgress(12);
        const me = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${accessToken}` } });
        const meJson = await me.json();
        currentUserId = meJson.id;
        setUserName(meJson.display_name || meJson.id || '');
        setUserId(currentUserId);
        setProgress(25);
      }

      let uris = [];
      if (mode === 'genre') {
        const genreParam = genre.toLowerCase().replace(/\s+/g, '-');
        setProgress(40);
        uris = await TrackUrisFromRecommendations(accessToken, { seed_genres: genreParam });
        setProgress(65);
      } else if (mode === 'artist') {
        setProgress(40);
        const qs = new URLSearchParams({ q: artist, type: 'artist', limit: 1 }).toString();
        const res = await fetch(`https://api.spotify.com/v1/search?${qs}`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        const artistObj = data.artists && data.artists.items && data.artists.items[0];
        if (!artistObj) throw new Error('Artist not found');
        const artistId = artistObj.id;
        setProgress(55);
        const topRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const topData = await topRes.json();
        uris = (topData.tracks || []).slice(0, 20).map(t => t.uri);
        if (uris.length < 8) {
          const more = await TrackUrisFromRecommendations(accessToken, { seed_artists: artistId });
          uris = uris.concat(more).slice(0,20);
        }
        setProgress(75);
      } else {
        setProgress(35);
        const keywords = (moodMap[mood] || mood || '').trim();
        if (!keywords) {
          uris = await TrackUrisFromSearch(accessToken, mood);
        } else {
          uris = await TrackUrisFromSearch(accessToken, keywords);
          if (uris.length < 8) {
            const seedGenres = keywords.split(' ').slice(0,2).join(',');
            const recs = await TrackUrisFromRecommendations(accessToken, { seed_genres: seedGenres });
            uris = uris.concat(recs).slice(0,20);
          }
        }
        setProgress(70);
      }

      if (!uris || uris.length === 0) throw new Error('No tracks found for that selection.');

      // create playlist and add tracks
      const finalName = title || (mode === 'genre' ? `Genre: ${genre}` : mode === 'artist' ? `Artist: ${artist}` : `Mood: ${mood}`);
      setProgress(80);
      const playlist = await createPlaylistAndAddTracks(accessToken, currentUserId, finalName, uris);
      setProgress(95);

      setPlaylistUrl(playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`);
      setPlaylistName(finalName);
      setProgress(100);
      setTimeout(()=>{ setLoading(false); setProgress(0); }, 500);

    } catch (err) {
      console.error(err);
      setLoading(false);
      setProgress(0);
      alert('Error creating playlist: ' + (err.message || err));
    }
  }

  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 20, textAlign: 'center' }}>
        <h1>Spotify Playlist Generator</h1>
        <p>Login to Spotify to create playlists from moods, genres, or artists.</p>
        <div style={{ marginTop: 20 }}>
          <LoginButton onClick={() => loginWithPKCE()} />
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