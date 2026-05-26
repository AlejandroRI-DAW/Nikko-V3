import { Link } from 'react-router';
import { MessageCircle, AlertCircle, BookOpen, Heart, Shield } from 'lucide-react';

export function Dashboard() {
  const cards = [
    {
      title: 'Habla con el Chat',
      description: 'Conversa con nuestro asistente',
      icon: MessageCircle,
      path: '/app',
      color: 'var(--color-primary)',
    },
    {
      title: 'Ayuda Urgente',
      description: 'Contactos de emergencia',
      icon: AlertCircle,
      path: '/app/emergency',
      color: 'var(--color-primary)',
    },
    {
      title: 'Recursos Emocionales',
      description: 'Consejos y apoyo',
      icon: BookOpen,
      path: '/app/resources',
      color: 'var(--color-primary)',
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 md:mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 md:mb-4" style={{ background: 'var(--color-primary)' }}>
            <Heart className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--color-surface)' }} />
          </div>
          <h1 className="text-2xl md:text-4xl mb-2 md:mb-3" style={{ color: 'var(--color-text)' }}>
            Bienvenido a tu espacio seguro
          </h1>
          <p className="text-sm md:text-lg px-4" style={{ color: 'var(--color-text-secondary)' }}>
            Aquí puedes encontrar apoyo, recursos y ayuda cuando lo necesites
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.path}
                to={card.path}
                className="group"
              >
                <div
                  className="p-5 md:p-8 rounded-3xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-3 md:mb-4"
                    style={{ background: card.color, opacity: 0.9 }}
                  >
                    <Icon className="w-6 h-6 md:w-7 md:h-7" style={{ color: 'var(--color-surface)' }} />
                  </div>
                  <h3 className="text-lg md:text-xl mb-1 md:mb-2" style={{ color: 'var(--color-text)' }}>
                    {card.title}
                  </h3>
                  <p className="text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div
          className="p-5 md:p-8 rounded-3xl shadow-md"
          style={{ background: 'var(--color-surface)' }}
        >
          <div className="flex items-start gap-3 md:gap-4">
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-secondary)' }}
            >
              <Shield className="w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h3 className="text-base md:text-lg mb-1 md:mb-2" style={{ color: 'var(--color-text)' }}>
                Tu privacidad es nuestra prioridad
              </h3>
              <p className="text-xs md:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Todas tus conversaciones son privadas y confidenciales. Este es un espacio seguro donde puedes expresarte libremente sin miedo a ser juzgado.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-8 text-center">
          <p className="text-xs md:text-sm mb-3 md:mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Frases que pueden ayudarte hoy
          </p>
          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            <div
              className="p-4 md:p-6 rounded-2xl"
              style={{ background: 'var(--color-secondary)' }}
            >
              <p className="text-sm md:text-base" style={{ color: 'var(--color-text)' }}>
                "No estás solo. Hay personas que se preocupan por ti."
              </p>
            </div>
            <div
              className="p-4 md:p-6 rounded-2xl"
              style={{ background: 'var(--color-secondary)' }}
            >
              <p className="text-sm md:text-base" style={{ color: 'var(--color-text)' }}>
                "Pedir ayuda es un acto de valentía, no de debilidad."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
