export default function PlaylistLink({ url, name }) {
  if (!url) return null;
  return (
    <div>
      <div>Playlist <strong>{name}</strong> created!</div>
      <div style={{ marginTop: 8 }}>
        <a href={url} target="_blank" rel="noopener noreferrer">Open in Spotify</a>
      </div>
    </div>
  );
}
