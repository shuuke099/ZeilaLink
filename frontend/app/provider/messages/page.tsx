'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Conversation = {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  lastMessage: any;
};

export default function ProviderMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find(c => c.userId === activeUserId) || null,
    [conversations, activeUserId]
  );

  useEffect(() => {
    if (user) { loadConversations(); }
  }, [user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setConversations(res.data || []);
      if ((res.data || []).length > 0) {
        setActiveUserId(res.data[0].userId);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    const res = await api.get(`/messages/conversations/${otherUserId}`);
    setMessages(res.data || []);
  };

  useEffect(() => {
    if (activeUserId) { loadMessages(activeUserId); }
  }, [activeUserId]);

  const send = async () => {
    if (!text.trim() || !activeUserId) return;
    try {
      setSending(true);
      await api.post('/messages', { toUserId: activeUserId, content: text });
      setText('');
      await loadMessages(activeUserId);
      await loadConversations();
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="p-8">Access denied</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        <div className="col-span-4 card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold">Conversations</div>
          {loading ? (
            <div className="p-4 text-primary-darker/70">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-primary-darker/70">No conversations yet.</div>
          ) : (
            <ul>
              {conversations.map((c) => {
                const getInitials = (name: string) => {
                  return name
                    .split(' ')
                    .map((n) => n.charAt(0).toUpperCase())
                    .join('')
                    .slice(0, 2);
                };
                return (
                  <li key={c.userId}>
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-primary/5 flex items-center gap-3 ${activeUserId === c.userId ? 'bg-primary/10' : ''}`}
                      onClick={() => setActiveUserId(c.userId)}
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                        {c.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.avatarUrl}
                            alt={c.userName}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('span');
                                fallback.className = 'text-sm font-semibold text-primary';
                                fallback.textContent = getInitials(c.userName);
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {getInitials(c.userName)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.userName}</div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="col-span-8 card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold">
            {activeConversation ? activeConversation.userName : 'Select a conversation'}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded-lg ${m.fromUserId === user?.id ? 'bg-primary text-white ml-auto' : 'bg-primary/10 text-primary-darker'}`}>
                <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            />
            <button className="btn-primary" onClick={send} disabled={sending}>{sending ? 'Sending...' : 'Send'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}


