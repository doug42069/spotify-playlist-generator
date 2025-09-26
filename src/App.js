import { useEffect, useState } from 'react';
import LoginButton from './components/LoginButton';
import PlaylistForm from './components/PlaylistForm';
import PlaylistLink from './components/PlaylistLink';
import { loginWithPKCE, handleRedirect } from './utils/spotifyAuth';

const moodMap = {
  chill: "chill acoustic ambient",
  workout: "energetic workout upbeat",
  party: "party dance pop",
  focus: "focus instrumental study"
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>Spotify Playlist Generator</h1>

      {!accessToken ? (
  <div
    style={{
      backgroundImage: 'url(/spotify-logo-green-background-tjanxyguzqwdqixi.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center', // horizontal alignment
      alignItems: 'center',     // vertical alignment
      flexDirection: 'column'
    }}
  >
    <h1 style={{ color: 'white', marginBottom: '20px' }}>Spotify Playlist Generator</h1>
    <LoginButton onClick={loginWithPKCE} />
  </div>
) : (
  <>
    {/* Logged-in view */}
  </>
)}
    </div>
  );
}

export default App;


