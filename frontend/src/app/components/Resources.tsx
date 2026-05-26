import { BookOpen, Heart, Lightbulb, Star } from 'lucide-react';

export function Resources() {
  const tips = [
    {
      title: 'Habla con alguien de confianza',
      description: 'No guardes tus sentimientos. Compartir lo que sientes con un adulto de confianza puede ayudarte mucho.',
      icon: Heart,
    },
    {
      title: 'Documenta lo que sucede',
      description: 'Guarda evidencia de mensajes, capturas o incidentes. Esto puede ser útil si necesitas ayuda.',
      icon: BookOpen,
    },
    {
      title: 'No respondas con agresividad',
      description: 'Responder con violencia solo empeora las cosas. Busca ayuda de un adulto responsable.',
      icon: Lightbulb,
    },
    {
      title: 'Recuerda tu valor',
      description: 'No eres lo que otros dicen de ti. Eres valioso y mereces respeto.',
      icon: Star,
    },
  ];

  const quotes = [
    'Eres más fuerte de lo que crees.',
    'No estás solo en esto.',
    'Pedir ayuda es un acto de valentía.',
    'Tus sentimientos son válidos.',
    'Cada día es una nueva oportunidad.',
    'Mereces ser tratado con respeto.',
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 md:mb-10 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 md:mb-4"
            style={{ background: 'var(--color-primary)' }}
          >
            <BookOpen className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--color-surface)' }} />
          </div>
          <h1 className="text-2xl md:text-3xl mb-2 md:mb-3" style={{ color: 'var(--color-text)' }}>
            Recursos Emocionales
          </h1>
          <p className="text-sm md:text-lg px-4" style={{ color: 'var(--color-text-secondary)' }}>
            Información y consejos para ayudarte en momentos difíciles
          </p>
        </div>

        <div className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl mb-4 md:mb-6" style={{ color: 'var(--color-text)' }}>
            Consejos contra el bullying
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
            {tips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div
                  key={index}
                  className="p-4 md:p-6 rounded-3xl shadow-md"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-3 md:mb-4"
                    style={{ background: 'var(--color-primary)', opacity: 0.9 }}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: 'var(--color-surface)' }} />
                  </div>
                  <h3 className="text-base md:text-lg mb-1 md:mb-2" style={{ color: 'var(--color-text)' }}>
                    {tip.title}
                  </h3>
                  <p className="text-xs md:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {tip.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl mb-4 md:mb-6" style={{ color: 'var(--color-text)' }}>
            Recuerda que...
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {quotes.map((quote, index) => (
              <div
                key={index}
                className="p-4 md:p-6 rounded-2xl text-center"
                style={{ background: 'var(--color-secondary)' }}
              >
                <p className="text-sm md:text-base" style={{ color: 'var(--color-text)' }}>
                  "{quote}"
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-5 md:p-8 rounded-3xl shadow-md"
          style={{ background: 'var(--color-surface)' }}
        >
          <h2 className="text-xl md:text-2xl mb-3 md:mb-4" style={{ color: 'var(--color-text)' }}>
            ¿Qué es el bullying?
          </h2>
          <p className="mb-3 md:mb-4 text-sm md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            El bullying o acoso escolar es cualquier forma de maltrato psicológico, verbal o físico producido entre estudiantes de forma reiterada. Puede incluir:
          </p>
          <ul className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 text-xs md:text-base" style={{ color: 'var(--color-text-secondary)' }}>
            <li>• Insultos y burlas constantes</li>
            <li>• Exclusión social deliberada</li>
            <li>• Amenazas y agresiones físicas</li>
            <li>• Difusión de rumores falsos</li>
            <li>• Cyberbullying (acoso en redes sociales)</li>
          </ul>
          <p className="text-xs md:text-sm" style={{ color: 'var(--color-text)' }}>
            Recuerda: el bullying NO es normal ni aceptable. Tienes derecho a estar seguro y ser respetado.
          </p>
        </div>
      </div>
    </div>
  );
}
