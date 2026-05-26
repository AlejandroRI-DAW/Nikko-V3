import { useState } from 'react';
import { useNavigate } from 'react-router';
import { User, Moon, Sun, Palette, Check, LogOut } from 'lucide-react';
import { useTheme, ThemeColor } from './ThemeProvider';

export function Profile() {
  const navigate = useNavigate();
  const { color, mode, setColor, setMode } = useTheme();
  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null);
  const [nickname, setNickname] = useState(localStorage.getItem('nikko-nickname') || '');
  const [nicknameInput, setNicknameInput] = useState(nickname);
  const [nicknameStatus, setNicknameStatus] = useState('');

  const themes: { value: ThemeColor; name: string; colors: string[]; gradient: string }[] = [
    { value: 'peach', name: 'Melocotón cálido', colors: ['#FFB5A7', '#FCD5CE', '#F8AD9D'], gradient: 'linear-gradient(135deg, #FFB5A7, #FCD5CE)' },
    { value: 'lavender', name: 'Lavanda suave', colors: ['#C4B5FD', '#E9D5FF', '#A78BFA'], gradient: 'linear-gradient(135deg, #C4B5FD, #E9D5FF)' },
    { value: 'blue', name: 'Azul cálido relajante', colors: ['#93C5FD', '#DBEAFE', '#60A5FA'], gradient: 'linear-gradient(135deg, #93C5FD, #DBEAFE)' },
    { value: 'beige', name: 'Beige neutro', colors: ['#D4C5B9', '#E8DDD1', '#B8A490'], gradient: 'linear-gradient(135deg, #D4C5B9, #E8DDD1)' }
  ];

  const currentColor = previewColor || color;

  const saveNickname = async () => {
    const nextNickname = nicknameInput.trim().toLowerCase();

    if (!nickname) {
      setNicknameStatus('Inicia sesion para cambiar tu nickname.');
      return;
    }

    if (nextNickname.length < 2) {
      setNicknameStatus('El nickname debe tener al menos 2 caracteres.');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/users/${encodeURIComponent(nickname)}/nickname`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newNickname: nextNickname }),
      });

      if (!response.ok) {
        setNicknameStatus('No se ha podido guardar. Puede que ya exista.');
        return;
      }

      const data = await response.json();
      localStorage.setItem('nikko-nickname', data.nickname);
      setNickname(data.nickname);
      setNicknameInput(data.nickname);
      setNicknameStatus('Nickname actualizado.');
    } catch (error) {
      setNicknameStatus('No se ha podido conectar con el servidor.');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 md:mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 md:mb-4"
            style={{ background: 'var(--color-primary)' }}
          >
            <User className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--color-surface)' }} />
          </div>
          <h1 className="text-2xl md:text-3xl mb-2 md:mb-3" style={{ color: 'var(--color-text)' }}>
            Perfil y Ajustes
          </h1>
          <p className="text-sm md:text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Personaliza tu experiencia
          </p>
        </div>

        <div
          className="mb-4 md:mb-6 p-4 md:p-6 rounded-3xl shadow-md"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="mb-3 md:mb-4 flex items-center gap-2">
            <h2 className="text-lg md:text-xl flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <User className="w-4 h-4 md:w-5 md:h-5" />
              Información personal
            </h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm mb-1.5 md:mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Nickname
              </label>
              <input
                type="text"
                value={nicknameInput || 'Sin sesion'}
                onChange={(event) => setNicknameInput(event.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 outline-none text-sm md:text-base"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                }}
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveNickname}
                  className="px-4 py-2 rounded-xl text-sm"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-surface)',
                  }}
                >
                  Guardar nickname
                </button>
                {nicknameStatus && (
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {nicknameStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="mb-4 md:mb-6 p-4 md:p-6 rounded-3xl shadow-md"
          style={{ background: 'var(--color-surface)' }}
        >
          <h2 className="text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            {mode === 'dark' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
            Modo de visualización
          </h2>
          <div className="flex gap-3 md:gap-4">
            <button
              onClick={() => setMode('light')}
              className="flex-1 p-3 md:p-4 rounded-2xl border-2 transition-all"
              style={{
                background: mode === 'light' ? 'var(--color-primary)' : 'var(--color-background)',
                borderColor: mode === 'light' ? 'var(--color-primary)' : 'var(--color-secondary)',
                color: mode === 'light' ? 'var(--color-surface)' : 'var(--color-text)',
              }}
            >
              <Sun className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 md:mb-2" />
              <span className="text-xs md:text-sm">Modo Claro</span>
            </button>
            <button
              onClick={() => setMode('dark')}
              className="flex-1 p-3 md:p-4 rounded-2xl border-2 transition-all"
              style={{
                background: mode === 'dark' ? 'var(--color-primary)' : 'var(--color-background)',
                borderColor: mode === 'dark' ? 'var(--color-primary)' : 'var(--color-secondary)',
                color: mode === 'dark' ? 'var(--color-surface)' : 'var(--color-text)',
              }}
            >
              <Moon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 md:mb-2" />
              <span className="text-xs md:text-sm">Modo Oscuro</span>
            </button>
          </div>
        </div>

        <div
          className="mb-4 md:mb-6 p-4 md:p-6 rounded-3xl shadow-md"
          style={{ background: 'var(--color-surface)' }}
        >
          <h2 className="text-lg md:text-xl mb-3 md:mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Palette className="w-4 h-4 md:w-5 md:h-5" />
            Paleta de colores
          </h2>
          <p className="text-xs md:text-sm mb-4 md:mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Elige el tema que más te guste. Todos los colores son cálidos y acogedores.
          </p>

          <div className="space-y-3 md:space-y-4">
            {themes.map((theme) => (
              <div
                key={theme.value}
                className="relative"
              >
                <button
                  onClick={() => setPreviewColor(theme.value)}
                  onDoubleClick={() => {
                    setColor(theme.value);
                    setPreviewColor(null);
                  }}
                  className="w-full p-3 md:p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 md:gap-4"
                  style={{
                    background: currentColor === theme.value ? theme.gradient : 'var(--color-background)', // Usar el gradiente
                    borderColor: currentColor === theme.value ? 'var(--color-primary)' : 'var(--color-secondary)',
                  }}
                >
                  <div className="flex gap-1.5 md:gap-2">
                    {theme.colors.map((themeColor, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 md:w-8 md:h-8 rounded-lg flex-shrink-0"
                        style={{ background: themeColor }}
                      />
                    ))}
                  </div>
                  <span className="text-sm md:text-base flex-1" style={{ color: 'var(--color-text)' }}>
                    {theme.name}
                  </span>
                  {color === theme.value && (
                    <Check className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  )}
                </button>

                {previewColor === theme.value && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        setColor(theme.value);
                        setPreviewColor(null);
                      }}
                      className="flex-1 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm"
                      style={{
                        background: 'var(--color-primary)',
                        color: 'var(--color-surface)',
                      }}
                    >
                      Aplicar tema
                    </button>
                    <button
                      onClick={() => setPreviewColor(null)}
                      className="flex-1 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm"
                      style={{
                        background: 'var(--color-secondary)',
                        color: 'var(--color-text)',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {previewColor && (
            <p className="mt-3 md:mt-4 text-xs md:text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Vista previa activa. Haz doble clic o pulsa "Aplicar tema" para guardar.
            </p>
          )}
        </div>

        <div
          className="p-4 md:p-6 rounded-3xl shadow-md"
          style={{ background: 'var(--color-surface)' }}
        >
          <h2 className="text-lg md:text-xl mb-3 md:mb-4" style={{ color: 'var(--color-text)' }}>
            Preferencias de privacidad
          </h2>
          <div className="space-y-2.5 md:space-y-3">
            <label className="flex items-center justify-between cursor-pointer gap-3">
              <span className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Mantener sesión iniciada
              </span>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 md:w-5 md:h-5 rounded cursor-pointer flex-shrink-0"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer gap-3">
              <span className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                Notificaciones de apoyo
              </span>
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 md:w-5 md:h-5 rounded cursor-pointer flex-shrink-0"
                style={{ accentColor: 'var(--color-primary)' }}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 md:mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 md:px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all"
            style={{
              background: '#B91C1C',
              color: '#FEE2E2',
              border: '1px solid #991B1B',
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
