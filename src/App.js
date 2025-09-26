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

  useEffect(() => {
    handleRedirect().then(token => {
      if (token) setAccessToken(token);
    });
  }, []);

  const generatePlaylist = async ({ mood, playlistName, songCount }) => {
    if (!accessToken) {
      alert("Please login first!");
      return;
    }

    try {
      const userRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const user = await userRes.json();

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
    <div>
      <h1>Spotify Playlist Generator</h1>
      {!accessToken && <LoginButton onClick={loginWithPKCE} />}
      <PlaylistForm onSubmit={generatePlaylist} />
      <PlaylistLink url={playlistUrl} name={playlistName} />
    </div>
  );
}

export default App;
