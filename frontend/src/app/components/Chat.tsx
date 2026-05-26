import { useState, useRef, useEffect } from 'react';
import { ChevronDown, History, LogIn, Mic, Plus, Send, Smile, Meh, Frown, Angry, Square, Trash2, Volume2, X } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const robotIcon = '/assets/robot_sin_fondo.png';
const personIcon = '/assets/persona_sin_fondo.png';
const lifebuoyIcon = '/assets/salvavidas_sin_fondo.png';
const chatApiUrl = 'http://127.0.0.1:8000/chat';
const apiUrl = 'http://127.0.0.1:8000';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSummary {
  chat_id: string;
  title: string;
  updated_at?: string;
  count: number;
}

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const createInitialMessage = (timestamp = new Date()): Message => ({
  id: '1',
  text: 'Hola, estoy aqui para escucharte.\n\nEste es un espacio seguro donde puedes expresarte libremente. ¿Como te sientes hoy?',
  sender: 'bot',
  timestamp,
});

const formatMadridTime = (date: Date) => (
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Madrid',
  }).format(date)
);

const parseMongoDate = (value?: string) => {
  if (!value) return new Date();

  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
};

const moodIcons = [
  { icon: Smile, label: 'Feliz', value: 'happy', color: '#22C55E', tint: 'rgba(34, 197, 94, 0.12)' },
  { icon: Meh, label: 'Neutro', value: 'neutral', color: '#94A3B8', tint: 'rgba(148, 163, 184, 0.14)' },
  { icon: Frown, label: 'Triste', value: 'sad', color: '#3B82F6', tint: 'rgba(59, 130, 246, 0.12)' },
  { icon: Angry, label: 'Enfadado', value: 'angry', color: '#EF4444', tint: 'rgba(239, 68, 68, 0.12)' },
];

const botResponses: Record<string, string[]> = {
  greeting: [
    'Hola, estoy aqui para escucharte.',
    'Bienvenido a tu espacio seguro. ¿Como te sientes hoy?',
  ],
  sad: [
    'Entiendo que te sientas asi. ¿Quieres contarme que esta pasando?',
    'Es completamente valido sentirse mal. Estoy aqui para escucharte sin juzgar.',
    'Tus emociones son importantes. Cuentame mas sobre lo que sientes.',
  ],
  anxiety: [
    'La ansiedad puede ser muy dificil. Respira profundo conmigo. ¿Que te esta causando preocupacion?',
    'Estoy aqui contigo. La ansiedad es real y valida. ¿Hay algo especifico que te este preocupando?',
  ],
  vent: [
    'Este es un espacio seguro para ti. Puedes contarme lo que necesites, sin presion.',
    'Estoy aqui para escucharte. Tomate el tiempo que necesites para expresarte.',
  ],
  support: [
    'No estas solo en esto. Hay personas que se preocupan por ti.',
    'Eres mas fuerte de lo que crees. Cada paso cuenta, incluso los pequenos.',
    'Recuerda: pedir ayuda es un acto de valentia, no de debilidad.',
  ],
  default: [
    'Te escucho. ¿Puedes contarme mas sobre eso?',
    'Entiendo. ¿Como te hace sentir esa situacion?',
    'Gracias por compartir eso conmigo. ¿Que mas te gustaria hablar?',
  ],
};

function getBotResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('mal') || msg.includes('triste') || msg.includes('deprimid')) {
    return botResponses.sad[Math.floor(Math.random() * botResponses.sad.length)];
  }

  if (msg.includes('ansiedad') || msg.includes('ansios') || msg.includes('nervios')) {
    return botResponses.anxiety[Math.floor(Math.random() * botResponses.anxiety.length)];
  }

  if (msg.includes('desahog') || msg.includes('hablar') || msg.includes('escuch')) {
    return botResponses.vent[Math.floor(Math.random() * botResponses.vent.length)];
  }

  if (msg.includes('hola') || msg.includes('buenos') || msg.includes('hey')) {
    return botResponses.greeting[Math.floor(Math.random() * botResponses.greeting.length)];
  }

  return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
}

export function Chat() {
  const { mode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([createInitialMessage()]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isMoodPickerOpen, setIsMoodPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem('nikko-nickname') || '');
  const [authPassword, setAuthPassword] = useState('');
  const [authNickname, setAuthNickname] = useState(() => localStorage.getItem('nikko-nickname') || '');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<ChatSummary | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const sessionIdRef = useRef<string>(
    crypto.randomUUID?.() || `session-${Date.now()}`
  );

  const selectedMoodLabel = moodIcons.find((mood) => mood.value === selectedMood)?.label;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchChatSummaries = async (userNickname = nickname) => {
    if (!userNickname) return;

    try {
      const response = await fetch(`${apiUrl}/chats/${encodeURIComponent(userNickname)}`);
      if (!response.ok) return;
      const data = await response.json();
      setChatSummaries(data.chats || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  useEffect(() => {
    if (nickname) {
      fetchChatSummaries(nickname);
    }
  }, [nickname]);

  const startNewChat = () => {
    sessionIdRef.current = crypto.randomUUID?.() || `session-${Date.now()}`;
    setMessages([createInitialMessage()]);
    setInput('');
    setUserMessageCount(0);
  };

  const loadChat = async (chatId: string) => {
    if (!nickname) return;

    try {
      const response = await fetch(`${apiUrl}/chats/${encodeURIComponent(nickname)}/${encodeURIComponent(chatId)}`);
      if (!response.ok) return;
      const data = await response.json();
      const savedMessages = data.messages || [];
      const firstSavedAt = savedMessages[0]?.created_at
        ? parseMongoDate(savedMessages[0].created_at)
        : new Date();
      const loadedMessages: Message[] = [createInitialMessage(firstSavedAt)];

      savedMessages.forEach((item: { prompt: string; respuesta_usuario: string; created_at?: string }, index: number) => {
        const sentAt = parseMongoDate(item.created_at);

        loadedMessages.push({
          id: `loaded-user-${index}`,
          text: item.prompt,
          sender: 'user',
          timestamp: sentAt,
        });
        loadedMessages.push({
          id: `loaded-bot-${index}`,
          text: item.respuesta_usuario,
          sender: 'bot',
          timestamp: sentAt,
        });
      });

      sessionIdRef.current = chatId;
      setMessages(loadedMessages);
      setUserMessageCount(loadedMessages.filter((message) => message.sender === 'user').length);
    } catch (error) {
      console.error('Error abriendo chat:', error);
    }
  };

  const deleteChat = async () => {
    if (!nickname || !chatToDelete) return;

    try {
      const response = await fetch(`${apiUrl}/chats/${encodeURIComponent(nickname)}/${encodeURIComponent(chatToDelete.chat_id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) return;

      setChatSummaries((prev) => prev.filter((chat) => chat.chat_id !== chatToDelete.chat_id));

      if (sessionIdRef.current === chatToDelete.chat_id) {
        startNewChat();
      }

      setChatToDelete(null);
    } catch (error) {
      console.error('Error borrando chat:', error);
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    try {
      const response = await fetch(`${apiUrl}/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: authNickname,
          password: authPassword,
        }),
      });

      if (!response.ok) {
        throw new Error('auth_failed');
      }

      const data = await response.json();
      localStorage.setItem('nikko-nickname', data.nickname);
      setNickname(data.nickname);
      setAuthNickname(data.nickname);
      setAuthPassword('');
      setShowAuthModal(false);
      fetchChatSummaries(data.nickname);
    } catch (error) {
      setAuthError(authMode === 'login' ? 'Nickname o contraseña incorrectos.' : 'No he podido crear esa cuenta.');
    }
  };

  const logout = () => {
    localStorage.removeItem('nikko-nickname');
    setNickname('');
    setChatSummaries([]);
    startNewChat();
  };

  const playBotAudio = async (message: Message) => {
    if (speakingMessageId) return;

    try {
      setSpeakingMessageId(message.id);
      const response = await fetch(`${apiUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.text }),
      });

      if (!response.ok) {
        throw new Error(`TTS returned ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeakingMessageId(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setSpeakingMessageId(null);
        addBotError('Ahora mismo no puedo reproducir el audio.');
      };
      await audio.play();
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      setSpeakingMessageId(null);
      addBotError('Ahora mismo no puedo reproducir el audio.');
    }
  };

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  };

  const buildChatHistory = (nextUserMessage: Message) => (
    [...messages, nextUserMessage]
      .filter((message) => message.id !== '1')
      .slice(-8)
      .map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }))
  );

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const nextUserMessageCount = userMessageCount + 1;
    setUserMessageCount(nextUserMessageCount);
    if (!nickname && nextUserMessageCount === 5) {
      setShowAuthModal(true);
    }
    setInput('');
    const textarea = document.querySelector<HTMLTextAreaElement>('[data-chat-input="true"]');
    if (textarea) {
      textarea.style.height = 'auto';
    }
    setIsTyping(true);

    try {
      const response = await fetch(chatApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: messageText,
          history: buildChatHistory(userMessage),
          sessionId: sessionIdRef.current,
          nickname: nickname || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API returned ${response.status}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.respuesta_usuario || data.reply || data.respuesta || 'Estoy aquí contigo, pero no he podido generar una respuesta.',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      if (nickname) {
        fetchChatSummaries(nickname);
      }
    } catch (error) {
      console.error('Error conectando con el backend:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Lo siento, ahora mismo no puedo conectar con el servidor de Nikko. Inténtalo de nuevo en unos segundos.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const addBotError = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  };

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      addBotError('Tu navegador no permite transcribir audio directamente. Puedes escribir el mensaje y te responderé igual.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();

      if (transcript) {
        setInput(transcript);
        handleSend(transcript);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      addBotError('No he podido entender el audio. Puedes intentarlo otra vez o escribir el mensaje.');
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    startRecording();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--color-background)' }}>
      {nickname && (
        <aside
          className="hidden lg:flex w-72 flex-col border-r"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-secondary)',
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--color-secondary)' }}>
            <button
              type="button"
              onClick={startNewChat}
              className="w-full px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm"
              style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}
            >
              <Plus className="w-4 h-4" />
              Nuevo chat
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 pt-4 pb-2" style={{ color: 'var(--color-text)' }}>
            <History className="w-4 h-4" />
            <span className="text-sm">Historial</span>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            {chatSummaries.map((chat) => (
              <div
                key={chat.chat_id}
                className="group flex items-center gap-1 rounded-xl"
                style={{
                  background: chat.chat_id === sessionIdRef.current ? 'var(--color-background)' : 'transparent',
                }}
              >
                <button
                  type="button"
                  onClick={() => loadChat(chat.chat_id)}
                  className="min-w-0 flex-1 text-left px-3 py-2 text-sm transition-all"
                  style={{ color: 'var(--color-text)' }}
                  title={chat.title}
                >
                  <span className="block truncate">{chat.title}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {chat.count} mensajes
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setChatToDelete(chat)}
                  className="w-8 h-8 mr-1 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    color: '#991B1B',
                    background: 'transparent',
                  }}
                  title="Borrar chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!chatSummaries.length && (
              <p className="px-3 py-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Tus chats apareceran aqui.
              </p>
            )}
          </div>
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-secondary)' }}>
            <div className="text-sm mb-2 truncate" style={{ color: 'var(--color-text)' }}>
              {nickname}
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-sm"
              style={{ color: '#991B1B' }}
            >
              Cerrar sesion
            </button>
          </div>
        </aside>
      )}

      <div className="flex flex-col flex-1 min-w-0" style={{ background: 'var(--color-background)' }}>
      <div
        className="p-4 md:p-6 border-b"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-secondary)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: 'var(--color-gradient)' }}
          >
            <img
              src={lifebuoyIcon}
              alt=""
              className="w-full h-full object-contain scale-160 translate-y-0.5"
              style={{ transformOrigin: 'center center' }}
            />
          </span>
          <h1 className="text-xl md:text-xl mb-1 md:mb-0" style={{ color: 'var(--color-text)' }}>
            Nikko
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {nickname ? (
              <span className="hidden sm:inline text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {nickname}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-2 rounded-xl flex items-center gap-2 text-sm"
                style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesion
              </button>
            )}
          </div>
        </div>

      </div>

      <div
        className="border-b"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-secondary)',
        }}
      >
        <button
          type="button"
          onClick={() => setIsMoodPickerOpen((open) => !open)}
          className="w-full px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 transition-all"
          style={{ color: 'var(--color-text)' }}
          aria-expanded={isMoodPickerOpen}
        >
          <span className="text-xs md:text-sm">
            ¿Como te sientes?
            {selectedMoodLabel && (
              <span className="ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedMoodLabel}
              </span>
            )}
          </span>

          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{
              color: 'var(--color-text-secondary)',
              transform: isMoodPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {isMoodPickerOpen && (
          <div className="px-3 md:px-6 pb-3 md:pb-4 flex gap-2 md:gap-3 overflow-x-auto">
            {moodIcons.map(({ icon: Icon, label, value, color, tint }) => {
              const active = selectedMood === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedMood(value)}
                  className="p-2 rounded-lg border transition-all flex-shrink-0"
                  style={{
                    background: active ? color : tint,
                    borderColor: active ? color : 'transparent',
                    color: active ? '#FFFFFF' : color,
                  }}
                  title={label}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        <div className="mx-auto w-full max-w-[900px] space-y-5 md:space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end gap-2 md:gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <span
                className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: 'var(--color-gradient)' }}
              >
                <img src={robotIcon} alt="" className="w-full h-full object-contain scale-125" />
              </span>
            )}
            <div
              className="max-w-[85%] md:max-w-[72%] min-w-0 px-4 md:px-5 py-2.5 md:py-3 rounded-3xl shadow-sm whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed"
              style={{
                background:
                  message.sender === 'bot'
                    ? 'var(--color-gradient)'
                    : 'var(--color-surface)',
                color: mode === 'dark' ? '#FFFFFF' : '#374151',
                overflowWrap: 'anywhere',
              }}
            >
              <span>{message.text}</span>
              <span
                className="block mt-1 text-[11px] leading-none text-right"
                style={{
                  color: mode === 'dark' ? 'rgba(255,255,255,0.72)' : '#6B7280',
                }}
              >
                {formatMadridTime(message.timestamp)}
              </span>
            </div>
            {message.sender === 'bot' && (
              <button
                type="button"
                onClick={() => playBotAudio(message)}
                disabled={speakingMessageId !== null}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: speakingMessageId === message.id ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: speakingMessageId === message.id ? 'var(--color-surface)' : 'var(--color-primary)',
                  opacity: speakingMessageId && speakingMessageId !== message.id ? 0.45 : 1,
                }}
                title="Reproducir mensaje"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            {message.sender === 'user' && (
              <span
                className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: 'var(--color-gradient)' }}
              >
                <img src={personIcon} alt="" className="w-full h-full object-contain scale-50" />
              </span>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start items-end gap-2 md:gap-3">
            <span
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ background: 'var(--color-gradient)' }}
            >
              <img src={robotIcon} alt="" className="w-full h-full object-contain scale-125" />
            </span>
            <div
              className="px-4 md:px-5 py-2.5 md:py-3 rounded-3xl shadow-sm flex items-center gap-2"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: 'var(--color-primary)',
                    animationDelay: '0ms',
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: 'var(--color-primary)',
                    animationDelay: '150ms',
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: 'var(--color-primary)',
                    animationDelay: '300ms',
                  }}
                />
              </div>

            </div>
          </div>
        )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-3 md:px-6 py-3 md:py-4" style={{ background: 'transparent' }}>
        <div className="mx-auto w-full max-w-[900px]">
          <div
            className="flex items-end gap-2 rounded-3xl border p-2 md:p-2.5 shadow-sm"
            style={{
              background: 'var(--color-background)',
              borderColor: 'var(--color-secondary)',
            }}
          >
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                resizeTextarea(e.target);
              }}
              onKeyDown={handleKeyPress}
              data-chat-input="true"
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 min-w-0 px-3 md:px-4 py-2.5 outline-none resize-none text-sm md:text-base leading-relaxed"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text)',
                maxHeight: '180px',
                overflowY: 'auto',
              }}
              rows={1}
            />

            <button
              type="button"
              onClick={handleMicClick}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full transition-all flex items-center justify-center shrink-0"
              style={{
                background: isRecording ? '#B91C1C' : 'var(--color-surface)',
                color: isRecording ? '#FFFFFF' : 'var(--color-primary)',
              }}
              title={isRecording ? 'Detener grabación' : 'Grabar audio'}
            >
              {isRecording ? (
                <Square className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSend()}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full transition-all flex items-center justify-center shrink-0"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-surface)',
              }}
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div
            className="w-full max-w-sm rounded-3xl p-5 shadow-xl"
            style={{ background: 'var(--color-surface)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ color: 'var(--color-text)' }}>
                {authMode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Puedes seguir sin iniciar sesion. Si entras, guardaremos tus chats con tu nickname.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input
                type="text"
                value={authNickname}
                onChange={(event) => setAuthNickname(event.target.value)}
                placeholder="Nickname"
                className="w-full px-4 py-3 rounded-xl border outline-none"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                }}
                required
              />
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Contrasena"
                className="w-full px-4 py-3 rounded-xl border outline-none"
                style={{
                  background: 'var(--color-background)',
                  borderColor: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                }}
                required
              />
              {authError && (
                <p className="text-sm" style={{ color: '#B91C1C' }}>
                  {authError}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl"
                style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}
              >
                {authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-sm"
                style={{ color: 'var(--color-accent)' }}
              >
                {authMode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
          <div
            className="w-full max-w-sm rounded-3xl p-5 shadow-xl"
            style={{ background: 'var(--color-surface)' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg" style={{ color: 'var(--color-text)' }}>
                  Borrar chat
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Se borrara este chat de tu historial.
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl px-4 py-3 mb-5"
              style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}
            >
              <p className="text-sm truncate">{chatToDelete.title}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {chatToDelete.count} mensajes
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setChatToDelete(null)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={deleteChat}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: '#991B1B',
                  color: '#FEE2E2',
                }}
              >
                Borrar chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
