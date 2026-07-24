import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { token } = await api.login(username, password);
      setToken(token);
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <h1>Daily Brief</h1>
        <p className="muted">Sign in to manage your tasks</p>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="hint">Default: admin / password</p>
      </form>
    </div>
  );
}
