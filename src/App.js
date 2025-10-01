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

function App() {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    handleRedirect().then(token => {
      if (token) {
        setAccessToken(token);
        fetchUser(token);
      }
    });

    if (accessToken && !user) {
      fetchUser(accessToken);
    }
  }, [accessToken]);

  const fetchUser = async (token) => {
    try {
      const res = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setAccessToken(null);
    setUser(null);
    setPlaylistUrl('');
    setPlaylistName('');
  };

  const generatePlaylist = async ({ mood, playlistName, songCount }) => {
    if (!accessToken) {
      alert("Please login first!");
      return;
    }

    try {
      const keywords = moodMap[mood] || "pop";
      const searchRes = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(keywords)}&type=track&limit=${songCount}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const searchData = await searchRes.json();
      const trackUris = searchData.tracks.items.map(t => t.uri);

      const playlistRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: playlistName,
          description: `Auto-generated ${mood} playlist`,
          public: false
        })
      });
      const newPlaylist = await playlistRes.json();

      if (trackUris.length) {
        await fetch(`https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ uris: trackUris })
        });
      }

      setPlaylistUrl(newPlaylist.external_urls.spotify);
      setPlaylistName(playlistName);
    } catch (err) {
      console.error("Error creating playlist:", err);
      alert("Something went wrong. Check the console.");
    }
  };

  return (
    !accessToken ? (
      <div
        style={{
          backgroundColor: '#000000ff',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <h1 style={{ marginBottom: '20px' }}>Spotify Playlist Generator</h1>
        <img
          src={`${process.env.PUBLIC_URL}/slogo.jpg`}
          alt="Spotify Logo"
          style={{ width: '300px', marginBottom: '30px' }}
        />
        <LoginButton onClick={loginWithPKCE} />
      </div>
    ) : (
      <div style={{
        maxWidth: 700,
        margin: '40px auto',
        padding: '30px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Spotify Playlist Generator</h1>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          {user && (
            <p>Logged in as <strong>{user.display_name || user.email}</strong></p>
          )}
          <button onClick={logout} style={{
            padding: '10px 20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Logout
          </button>
        </div>
        <PlaylistForm onSubmit={generatePlaylist} />
        <div style={{ marginTop: '30px' }}>
          <PlaylistLink url={playlistUrl} name={playlistName} />
        </div>
      </div>
    )
  );
}

export default App;
