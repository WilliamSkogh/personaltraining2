import { FormEvent, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login, loading, error } = useAuth();


  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Fyll i både e-post och lösenord.');
      return;
    }

    try {
      await login({ email, password });

    } catch {
  
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white shadow rounded-2xl p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Logga in</h1>

        {(localError || error) && (
          <div className="text-red-600 text-sm">
            {localError || error}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            E-post
          </label>
          <input
            id="email"
            type="email"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="namn@exempel.se"
            autoComplete="username"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Lösenord
          </label>
          <input
            id="password"
            type="password"
            className="w-full border rounded-lg px-3 py-2 outline-none focus:ring"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-2 bg-black text-white disabled:opacity-60"
        >
          {loading ? 'Loggar in…' : 'Logga in'}
        </button>
      </form>
    </div>
  );
}
