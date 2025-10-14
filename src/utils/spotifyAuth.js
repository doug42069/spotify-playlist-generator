export const client_id = "1267af26e8d84a13a3e6e3655e7849e4";
export const redirect_uri = "https://doug42069.github.io/spotify-playlist-generator/";
export const scopes = [
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-private",
  "user-read-email"
].join(" ");

export function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return hashBuffer;
}


export function base64URLEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function loginWithPKCE() {
  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(64);

  sessionStorage.setItem('pkce_state', state);
  sessionStorage.setItem('pkce_code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64URLEncode(hashed);

  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id,
    scope: scopes,
    redirect_uri,
    state,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  });

  const authUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;
  window.location = authUrl;
}

export async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.warn('Spotify auth error:', error);
    window.history.replaceState({}, document.title, redirect_uri);
    return null;
  }

  if (!code) return null;

  const savedState = sessionStorage.getItem('pkce_state');
  if (!savedState || savedState !== state) {
    console.warn('PKCE state mismatch or missing — possible CSRF.');
    window.history.replaceState({}, document.title, redirect_uri);
    return null;
  }

  const codeVerifier = sessionStorage.getItem('pkce_code_verifier') || '';
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id,
    code_verifier: codeVerifier
  });

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('Token exchange failed:', res.status, txt);
      window.history.replaceState({}, document.title, redirect_uri);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    sessionStorage.removeItem('pkce_state');
    sessionStorage.removeItem('pkce_code_verifier');

    window.history.replaceState({}, document.title, redirect_uri);

    return data.access_token;
  } catch (err) {
    console.error('Error exchanging code for token:', err);
    window.history.replaceState({}, document.title, redirect_uri);
    return null;
  }
}

export async function refreshAccessTokenIfNeeded() {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id
  });

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    if (!res.ok) {
      console.error('Refresh token request failed', res.status);
      return null;
    }
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    // update refresh_token if Spotify returned a new one
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data.access_token;
  } catch (err) {
    console.error('Error refreshing token', err);
    return null;
  }
}

export function clearStoredTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  sessionStorage.removeItem('pkce_state');
  sessionStorage.removeItem('pkce_code_verifier');
}
