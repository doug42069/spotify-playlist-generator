export default function LoginButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        fontSize: '18px',
        backgroundColor: '#2c7a48ff',
        color: 'white',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      Login to Spotify
    </button>
  );
}