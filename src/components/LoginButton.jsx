export default function LoginButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        fontSize: '18px',
        backgroundColor: '#1DB954',
        color: 'white',
        border: 'none',
        borderRadius: 30,
        cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(0,0,0,0.3)'
      }}
    >
      {children || 'Login to Spotify'}
    </button>
  );
}
