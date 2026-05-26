import { Phone, Mail, AlertCircle } from 'lucide-react';
import imgAcoso from '../../styles/fotos/1.png';
import imgObservador from '../../styles/fotos/2.png';
import imgLlamada from '../../styles/fotos/3.png';
import imgCrisis from '../../styles/fotos/4.png';
export function Emergency() {
  const contacts = [
    {
      name: 'Línea Nacional contra el Bullying',
      phone: '900 018 018',
      email: 'ayuda@contraelbullying.org',
      description: 'Atención 24/7 para casos de acoso escolar',
    },
    {
      name: 'ANAR - Ayuda a Niños y Adolescentes',
      phone: '900 20 20 10',
      email: 'telefono@anar.org',
      description: 'Apoyo psicológico inmediato',
    },
    {
      name: 'Fundación ANAR',
      phone: '116 111',
      email: 'contacto@anar.org',
      description: 'Línea de ayuda para menores',
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 md:mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 md:mb-4"
            style={{ background: 'var(--color-accent)' }}
          >
            <AlertCircle className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--color-surface)' }} />
          </div>
          <h1 className="text-2xl md:text-3xl mb-2 md:mb-3" style={{ color: 'var(--color-text)' }}>
            Ayuda Urgente
          </h1>
          <p className="text-sm md:text-lg px-4" style={{ color: 'var(--color-text-secondary)' }}>
            Si necesitas ayuda inmediata, estos contactos están disponibles para ti
          </p>
        </div>

        <div
          className="mb-4 md:mb-6 p-4 md:p-6 rounded-2xl"
          style={{ background: 'var(--color-secondary)' }}
        >
          <p className="text-center text-sm md:text-base" style={{ color: 'var(--color-text)' }}>
            No estás solo. Hay personas especializadas esperando para ayudarte. No dudes en contactar.
          </p>
        </div>

        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="p-4 md:p-6 rounded-3xl shadow-lg"
              style={{ background: 'var(--color-surface)' }}
            >
              <h3 className="text-lg md:text-xl mb-1 md:mb-2" style={{ color: 'var(--color-text)' }}>
                {contact.name}
              </h3>
              <p className="text-xs md:text-sm mb-3 md:mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {contact.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm md:text-base"
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-surface)',
                  }}
                >
                  <Phone className="w-4 h-4 md:w-5 md:h-5" />
                  <span>{contact.phone}</span>
                </a>

                <a
                  href={`mailto:${contact.email}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl transition-all truncate"
                  style={{
                    background: 'var(--color-secondary)',
                    color: 'var(--color-text)',
                  }}
                >
                  <Mail className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="text-xs md:text-sm truncate">{contact.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-6 md:mt-8 p-4 md:p-6 rounded-2xl"
          style={{
            background: 'var(--color-surface)',
            border: '3px solid var(--color-primary)', /* Borde usando la misma variable */
          }}
        >
          <h3 className="text-center md:text-lg mb-2 md:mb-3" style={{ color: 'var(--color-text)' }}>
            ¿Cuándo llamar?
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="call-card">
              <img
                src={imgAcoso}
                alt="Acoso"
                className="mb-2 w-full h-auto rounded-lg"
                style={{ border: '3px solid #0084A8' }}
              />
            </div>

            <div className="call-card">
              <img
                src={imgObservador}
                alt="Observador"
                className="mb-2 w-full h-auto rounded-lg"
                style={{ border: '3px solid #00A894' }}
              />
            </div>

            <div className="call-card">
              <img
                src={imgLlamada}
                alt="Llamada"
                className="mb-2 w-full h-auto rounded-lg"
                style={{ border: '3px solid #8600A8' }}
              />
            </div>

            <div className="call-card">
              <img
                src={imgCrisis}
                alt="Crisis"
                className="mb-2 w-full h-auto rounded-lg"
                style={{ border: '3px solid #BF4300' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
