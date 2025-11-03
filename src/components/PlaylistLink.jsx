export default function PlaylistLink({ url, name }) {
  if (!url) return null;

  return (
    <div
      style={{
        marginTop: 24,
        textAlign: 'center',
        backgroundColor: '#181818',
        padding: 20,
        borderRadius: 12,
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ fontSize: '18px', marginBottom: 8 }}>
        ✅ Playlist <strong>{name}</strong> created!
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: 10,
          padding: '10px 20px',
          backgroundColor: '#1DB954',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '8px',
          textDecoration: 'none',
          transition: 'background 0.3s',
        }}
        onMouseOver={e => (e.target.style.backgroundColor = '#1ed760')}
        onMouseOut={e => (e.target.style.backgroundColor = '#1DB954')}
      >
        Open in Spotify
      </a>
    </div>
  );
}
