'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

type BotAction =
  | 'initial'
  | 'greeting'
  | 'jobs'
  | 'services'
  | 'employer'
  | 'guidance'
  | 'contact'
  | 'register'
  | 'help'
  | 'thanks'
  | 'default'
  | 'NAV_JOBS'
  | 'NAV_SERVICES'
  | 'NAV_TRAININGS'
  | 'NAV_REGISTER'
  | 'NAV_CONTACT'
  | 'OPEN_WHATSAPP';

type QuickOption = {
  label: string;
  action: BotAction;
};

type Message = {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: number;
  options?: QuickOption[];
};

const STORAGE_KEY = 'somjob_chatbot_messages_v2';
const MAX_STORED_MESSAGES = 60;

const INTENT_KEYWORDS: Record<Exclude<BotAction, 'initial' | 'default' | 'help' | 'thanks' | 'greeting' | 'NAV_JOBS' | 'NAV_SERVICES' | 'NAV_TRAININGS' | 'NAV_REGISTER' | 'NAV_CONTACT' | 'OPEN_WHATSAPP'>, string[]> = {
  jobs: ['job', 'jobs', 'work', 'career', 'vacancy', 'vacancies', 'shaqo', 'shaqooyin'],
  services: ['service', 'services', 'adeeg', 'adeegyo', 'consulting'],
  employer: ['hire', 'hiring', 'post', 'recruit', 'employer', 'company', 'loo-shaqeeye'],
  guidance: ['training', 'skill', 'skills', 'learn', 'course', 'courses', 'tababar', 'tababaro'],
  contact: ['contact', 'phone', 'email', 'support', 'helpdesk', 'xiriir', 'xidhiidh'],
  register: ['register', 'signup', 'sign up', 'create account', 'isdiiwaangeli'],
};

function nowId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createWelcomeMessage(isEn: boolean): Message {
  return {
    id: nowId(),
    type: 'bot',
    text: isEn
      ? 'Welcome to ZeilaLink Guide. I can help you find jobs, services, training, and employer tools.'
      : 'Ku soo dhawoow Hagaha ZeilaLink. Waxaan kaa caawin karaa shaqooyin, adeegyo, tababaro, iyo adeegyada loo-shaqeeyaha.',
    timestamp: Date.now(),
    options: [
      { label: isEn ? 'Search Jobs' : 'Raadi Shaqooyin', action: 'jobs' },
      { label: isEn ? 'View Services' : 'Eeg Adeegyada', action: 'services' },
      { label: isEn ? 'Training Guidance' : 'Hagid Tababar', action: 'guidance' },
      { label: isEn ? 'Contact Support' : 'La xiriir Taageero', action: 'contact' },
    ],
  };
}

function getIntent(text: string): BotAction {
  const normalized = text.toLowerCase().trim();

  if (normalized.startsWith('/help')) return 'help';
  if (normalized.startsWith('/reset')) return 'initial';
  if (/(hello|hi|hey|salaam|asc|asalaam)/.test(normalized)) return 'greeting';
  if (/(thanks|thank you|mahadsanid|mahadsantahay)/.test(normalized)) return 'thanks';

  let bestAction: BotAction = 'default';
  let bestScore = 0;

  (Object.keys(INTENT_KEYWORDS) as Array<keyof typeof INTENT_KEYWORDS>).forEach((action) => {
    const score = INTENT_KEYWORDS[action].reduce((acc, word) => (normalized.includes(word) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestAction = action;
      bestScore = score;
    }
  });

  return bestScore > 0 ? bestAction : 'default';
}

function toApiMessages(messages: Message[], latestUserText: string) {
  const history = messages
    .filter((m) => m.type === 'bot' || m.type === 'user')
    .slice(-10)
    .map((m) => ({
      role: m.type === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

  history.push({ role: 'user', content: latestUserText });
  return history;
}

function getBotReply(action: BotAction, isEn: boolean): { text: string; options?: QuickOption[] } {
  switch (action) {
    case 'greeting':
      return {
        text: isEn
          ? 'Great to see you. What would you like to do first?'
          : 'Waa ku faraxsanahay. Maxaad rabtaa inaan ku bilaabno?',
        options: [
          { label: isEn ? 'Find Jobs' : 'Raadi Shaqo', action: 'jobs' },
          { label: isEn ? 'Explore Services' : 'Baadh Adeegyada', action: 'services' },
          { label: isEn ? 'Create Account' : 'Samee Akoon', action: 'register' },
        ],
      };
    case 'jobs':
      return {
        text: isEn
          ? 'You can browse active job listings and filter by role, location, and type.'
          : 'Waxaad baari kartaa shaqooyinka firfircoon, kadibna ku kala shaandheyn kartaa nooc, goob, iyo xil.',
        options: [{ label: isEn ? 'Go to Jobs' : 'Tag Shaqooyinka', action: 'NAV_JOBS' }],
      };
    case 'services':
      return {
        text: isEn
          ? 'Our services include Cleaning, IT & Tech, Construction, and Marketing with detailed profiles.'
          : 'Adeegyadeenu waxay ka koobanyihiin Nadiifin, IT & Tech, Dhismo, iyo Suuq-geyn oo leh faahfaahin buuxda.',
        options: [{ label: isEn ? 'Open Services' : 'Fur Adeegyada', action: 'NAV_SERVICES' }],
      };
    case 'employer':
      return {
        text: isEn
          ? 'Employers can post jobs, review applicants, and manage hiring from one dashboard.'
          : 'Loo-shaqeeyayaashu waxay daabici karaan shaqooyin, qiimeyn karaan codsadayaasha, oo maamuli karaan shaqaalaysiinta.',
        options: [
          { label: isEn ? 'Create Employer Account' : 'Samee Akoon Loo-shaqeeye', action: 'NAV_REGISTER' },
          { label: isEn ? 'Contact Team' : 'La xiriir Kooxda', action: 'NAV_CONTACT' },
        ],
      };
    case 'guidance':
      return {
        text: isEn
          ? 'Training programs can help improve your skills and increase your hiring opportunities.'
          : 'Barnaamijyada tababarku waxay kor u qaadaan xirfadahaaga waxayna kordhiyaan fursadaha shaqaalaysiinta.',
        options: [{ label: isEn ? 'View Trainings' : 'Eeg Tababarada', action: 'NAV_TRAININGS' }],
      };
    case 'contact':
      return {
        text: isEn
          ? 'You can contact support by WhatsApp or use the contact page for direct assistance.'
          : 'Waxaad taageerada kula xiriiri kartaa WhatsApp ama bogga contact-ka.',
        options: [
          { label: isEn ? 'Open WhatsApp' : 'Fur WhatsApp', action: 'OPEN_WHATSAPP' },
          { label: isEn ? 'Contact Page' : 'Bogga Xiriirka', action: 'NAV_CONTACT' },
        ],
      };
    case 'register':
      return {
        text: isEn
          ? 'Create your account to apply for jobs, book services, and track your progress.'
          : 'Samee akoon si aad u codsato shaqooyin, u dalbato adeegyo, una la socoto horumarkaaga.',
        options: [{ label: isEn ? 'Go to Register' : 'Tag Isdiiwaangelin', action: 'NAV_REGISTER' }],
      };
    case 'help':
      return {
        text: isEn
          ? 'Commands: /help shows tips, /reset clears this chat. You can ask about jobs, services, training, contact, or employer tools.'
          : 'Amarro: /help wuxuu muujinayaa caawimaad, /reset wuxuu nadiifiyaa chat-ka. Waxaad waydiin kartaa shaqooyin, adeegyo, tababaro, xiriir, ama loo-shaqeeye.',
      };
    case 'thanks':
      return {
        text: isEn ? 'You are welcome. I am here whenever you need help.' : 'Aad baad u mahadsantahay. Mar walba waan ku caawinayaa.',
      };
    default:
      return {
        text: isEn
          ? 'I did not fully catch that. Try asking about jobs, services, training, contact, or account setup.'
          : 'Si buuxda uma fahmin. Isku day inaad waydiiso shaqooyin, adeegyo, tababaro, xiriir, ama sameynta akoon.',
        options: [
          { label: isEn ? 'Jobs' : 'Shaqooyin', action: 'jobs' },
          { label: isEn ? 'Services' : 'Adeegyo', action: 'services' },
          { label: isEn ? 'Help' : 'Caawimaad', action: 'help' },
        ],
      };
  }
}

export default function ChatBot() {
  const { language } = useLanguage();
  const pathname = usePathname();
  const isEn = language === 'en';
  const isAdmin = pathname?.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore corrupted local storage entries
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized || typeof window === 'undefined') return;
    try {
      const bounded = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
    } catch {
      // ignore storage errors
    }
  }, [messages, initialized]);

  useEffect(() => {
    if (!isOpen || !initialized) return;
    if (messages.length > 0) return;

    setMessages([createWelcomeMessage(isEn)]);
  }, [isOpen, initialized, isEn, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (type: 'bot' | 'user', text: string, options?: QuickOption[]) => {
    const newMessage: Message = {
      id: nowId(),
      type,
      text,
      timestamp: Date.now(),
      options,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const navigateByAction = (action: BotAction): boolean => {
    switch (action) {
      case 'NAV_JOBS':
        window.location.href = '/jobs';
        return true;
      case 'NAV_SERVICES':
        window.location.href = '/services';
        return true;
      case 'NAV_TRAININGS':
        window.location.href = '/trainings';
        return true;
      case 'NAV_REGISTER':
        window.location.href = '/register';
        return true;
      case 'NAV_CONTACT':
        window.location.href = '/contact';
        return true;
      case 'OPEN_WHATSAPP':
        window.open('https://wa.me/252612011700', '_blank');
        return true;
      default:
        return false;
    }
  };

  const processAction = (action: BotAction) => {
    if (navigateByAction(action)) return;

    if (action === 'initial') {
      const welcome = createWelcomeMessage(isEn);
      setMessages([welcome]);
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      const reply = getBotReply(action, isEn);
      addMessage('bot', reply.text, reply.options);
      setIsTyping(false);
    }, 650);
  };

  const requestAiReply = async (userText: string, fallbackIntent: BotAction) => {
    setIsTyping(true);
    try {
      const payload = {
        language: isEn ? 'en' : 'so',
        messages: toApiMessages(messages, userText),
      };

      const response = await api.post('/chat/assistant', payload);
      const reply = response.data?.reply;

      if (typeof reply === 'string' && reply.trim()) {
        addMessage('bot', reply.trim());
      } else {
        const fallback = getBotReply(fallbackIntent, isEn);
        addMessage('bot', fallback.text, fallback.options);
      }
    } catch {
      const fallback = getBotReply(fallbackIntent, isEn);
      addMessage('bot', fallback.text, fallback.options);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptionClick = (action: BotAction, label: string) => {
    addMessage('user', label);
    processAction(action);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    addMessage('user', text);

    const intent = getIntent(text);
    if (intent === 'initial' || intent === 'help') {
      processAction(intent);
      return;
    }

    void requestAiReply(text, intent);
  };

  if (isAdmin) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[100] font-poppins md:bottom-8 md:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            className="mb-6 w-[400px] max-w-[calc(100vw-32px)] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col h-[600px] max-h-[calc(100vh-120px)]"
          >
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Bot className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-white font-black text-base leading-tight">ZeilaLink Guide</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    {isEn ? 'Smart Assistant' : 'Kaaliye Caqli leh'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-5 space-y-5">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2.5 max-w-[86%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                        msg.type === 'bot' ? 'bg-primary/10 text-primary' : 'bg-slate-900 text-white'
                      }`}
                    >
                      {msg.type === 'bot' ? <Bot size={15} /> : <User size={15} />}
                    </div>
                    <div className="space-y-2">
                      <div
                        className={`p-4 rounded-[1.2rem] shadow-sm ${
                          msg.type === 'bot' ? 'bg-slate-50 text-slate-900 border border-slate-100' : 'bg-primary text-white font-medium'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>

                      {msg.options && msg.options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.options.map((opt, idx) => (
                            <button
                              key={`${msg.id}_${idx}`}
                              onClick={() => handleOptionClick(opt.action, opt.label)}
                              className="px-3 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:border-primary hover:text-primary transition-all shadow-sm flex items-center gap-1.5"
                            >
                              {opt.label}
                              <ArrowRight size={12} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 p-4 rounded-3xl flex gap-1 border border-slate-100">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100">
              <form onSubmit={handleSend} className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isEn ? 'Ask about jobs, services, training... or /help' : 'Weydii shaqo, adeeg, tababar... ama /help'}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-5 pr-14 py-3.5 focus:outline-none focus:border-primary transition-all text-sm font-medium shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 top-1.5 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  <Send size={17} />
                </button>
              </form>
              <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-[0.18em] text-center">
                {isEn ? 'Tip: use /reset to clear chat' : 'Talo: isticmaal /reset si aad u nadiifiso chat-ka'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-slate-900' : 'bg-primary'
        }`}
      >
        {isOpen ? (
          <X className="text-white" size={28} />
        ) : (
          <div className="relative">
            <MessageSquare className="text-white" size={28} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-primary animate-pulse" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
