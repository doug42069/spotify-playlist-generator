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

  const supportedGenres = [
    "acoustic","afrobeat","alt-rock","alternative","ambient","anime","black-metal",
    "bluegrass","blues","bossanova","brazil","breakbeat","british","cantopop","chicago-house",
    "classical","club","comedy","country","dance","dancehall","death-metal","deep-house",
    "detroit-techno","disco","drum-and-bass","dub","dubstep","edm","electronic","emo","folk",
    "forro","french","funk","garage","german","gospel","goth","grindcore","groove","grunge",
    "guitar","happy","hard-rock","hardcore","hardstyle","heavy-metal","hip-hop","holidays",
    "house","idm","indian","indie","indie-pop","industrial","iranian","j-dance","j-idol","j-pop",
    "j-rock","jazz","k-pop","kids","latin","latino","malay","mandopop","metal","metal-misc",
    "metalcore","minimal-techno","movies","mpb","new-age","new-release","opera","pagode","party",
    "philippines-opm","piano","pop","pop-film","post-dubstep","power-pop","progressive-house",
    "psych-rock","punk","punk-rock","r-n-b","rainy-day","reggae","reggaeton","road-trip","rock",
    "rock-n-roll","rockabilly","romance","sad","salsa","samba","sertanejo","show-tunes","singer-songwriter",
    "ska","sleep","songwriter","soul","soundtracks","spanish","study","summer","swedish","synth-pop",
    "tango","techno","trance","trip-hop","turkish","work-out","world-music"
  ];

  let validGenre = supportedGenres.includes(seed) ? seed : null;

  if (!validGenre) {
    console.warn(`Genre "${seed}" is not in Spotify’s supported seed list. Falling back to keyword search.`);
    uris = await TrackUrisFromSearch(accessToken, genre, desired);
  } else {
    uris = await TrackUrisFromRecommendations(accessToken, { seed_genres: validGenre }, desired);
  }

  if (!uris || uris.length < desired) {
    const more = await TrackUrisFromRecommendations(accessToken, { seed_genres: 'pop' }, desired - (uris?.length || 0));
    uris = (uris || []).concat(more).slice(0, desired);
  }

  setProgress(65);

      } else if (mode === 'artist') {
  setProgress(35);

  const qs = new URLSearchParams({ q: artist, type: 'artist', limit: 1 }).toString();
  const res = await fetch(`https://api.spotify.com/v1/search?${qs}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Artist search failed');
  const data = await res.json();
  const artistObj = data.artists?.items?.[0];
  if (!artistObj) throw new Error('Artist not found');
  const artistId = artistObj.id;

  const trackPool = new Set();

  setProgress(45);
  try {
    const topRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (topRes.ok) {
      const topData = await topRes.json();
      (topData.tracks || []).forEach(t => t.uri && trackPool.add(t.uri));
    }
  } catch {}

  setProgress(60);
  try {
    const albQs = new URLSearchParams({ include_groups: 'album,single,compilation', limit: 20 }).toString();
    const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?${albQs}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (albumsRes.ok) {
      const albumsData = await albumsRes.json();
      const albums = albumsData.items || [];
      for (const a of albums.slice(0, 10)) {
        const tracksRes = await fetch(`https://api.spotify.com/v1/albums/${a.id}/tracks?limit=50`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!tracksRes.ok) continue;
        const tracksData = await tracksRes.json();
        (tracksData.items || []).forEach(t => t.uri && trackPool.add(t.uri));
      }
    }
  } catch {}

  setProgress(75);
  try {
    const recs = await TrackUrisFromRecommendations(accessToken, { seed_artists: artistId }, 50);
    recs.forEach(u => trackPool.add(u));
  } catch {}

  let allUris = Array.from(trackPool);
  if (allUris.length === 0) throw new Error('No tracks found for this artist.');

  for (let i = allUris.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allUris[i], allUris[j]] = [allUris[j], allUris[i]];
  }

  const desired = Math.min(Math.max(Number(count) || 20, 1), 100);
  uris = allUris.slice(0, desired);
  setProgress(95);

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