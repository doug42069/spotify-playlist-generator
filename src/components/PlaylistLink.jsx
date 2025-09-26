export default function PlaylistLink({ url, name }) {
  return url ? (
    <div>
      Playlist "<strong>{name}</strong>" created!{' '}
      <a href={url} target="_blank" rel="noopener noreferrer">Open in Spotify</a>
    </div>
  ) : null;
}
