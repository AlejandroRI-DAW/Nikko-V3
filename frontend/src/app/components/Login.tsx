import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Heart } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/app');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-6"
      style={{ background: 'var(--color-background)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full mb-3 md:mb-4" style={{ background: 'var(--color-primary)' }}>
            <Heart className="w-7 h-7 md:w-8 md:h-8" style={{ color: 'var(--color-surface)' }} />
          </div>
          <h1 className="text-2xl md:text-3xl mb-2" style={{ color: 'var(--color-text)' }}>
            Bienvenido a tu espacio seguro
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Un lugar donde puedes expresarte sin ser juzgado
          </p>
        </div>

        <div
          className="rounded-3xl p-6 md:p-8 shadow-lg"
          style={{ background: 'var(--color-surface)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm" style={{ color: 'var(--color-text)' }}>
                {isLogin ? 'Nickname' : 'Crea tu nickname'}
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                }}
                placeholder="Tu nickname"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm" style={{ color: 'var(--color-text)' }}>
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                }}
                placeholder="********"
                required
              />
            </div>

            {isLogin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                  Recordar mi sesion
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-surface)',
              }}
            >
              {isLogin ? 'Iniciar sesion' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm transition-colors"
              style={{ color: 'var(--color-accent)' }}
            >
              {isLogin
                ? 'No tienes cuenta? Registrate aqui'
                : 'Ya tienes cuenta? Inicia sesion'}
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Tu privacidad y bienestar son nuestra prioridad
        </p>
      </div>
    </div>
  );
}
