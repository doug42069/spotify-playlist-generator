export const client_id = "bd53535497384e2192f495522d3f3274";
export const redirect_uri = "https://doug42069.github.io/spotify-playlist-generator/";
export const scopes = [
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-private",
  "user-read-email"
].join(" ");

export function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

export function base64URLEncode(str) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256(buffer) {
  return await crypto.subtle.digest('SHA-256', buffer);
}

export async function loginWithPKCE() {
  const codeVerifier = generateRandomString(128);
  localStorage.setItem('code_verifier', codeVerifier);

  const encoder = new TextEncoder();
  const codeChallenge = base64URLEncode(await sha256(encoder.encode(codeVerifier)));

  const url = `https://accounts.spotify.com/authorize?` +
              `client_id=${client_id}` +
              `&response_type=code` +
              `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
              `&scope=${encodeURIComponent(scopes)}` +
              `&code_challenge_method=S256` +
              `&code_challenge=${codeChallenge}`;

  window.location = url;
}

export async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return null;

  const codeVerifier = localStorage.getItem('code_verifier');
  const body = new URLSearchParams({
    client_id,
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    code_verifier: codeVerifier
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  window.history.replaceState({}, document.title, redirect_uri);
  return data.access_token;
}
