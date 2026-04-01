import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/Layout';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
const inputStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

let socket;

export default function Chat() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEnd = useRef(null);
  const typingTimeout = useRef(null);
  const currentUserId = user?.id || user?._id;

  /* ── Socket setup ── */
  useEffect(() => {
    socket = io(SOCKET_URL);
    socket.on('connect', () => {
      if (currentUserId) socket.emit('join', currentUserId);
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Update last message in room list
      setRooms((prev) => prev.map((r) =>
        r._id === (msg.room || msg.roomId) ? { ...r, lastMessage: msg } : r
      ));
    });

    socket.on('chat:typing', ({ userId, userName, roomId }) => {
      if (userId === currentUserId) return;
      setTypingUsers((prev) => {
        if (prev.some((t) => t.userId === userId && t.roomId === roomId)) return prev;
        return [...prev, { userId, userName, roomId }];
      });
      // Auto-clear typing after 3s
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((t) => !(t.userId === userId && t.roomId === roomId)));
      }, 3000);
    });

    return () => socket?.disconnect();
  }, [currentUserId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  /* ── Fetch rooms ── */
  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const { data } = await api.get('/chat/rooms');
      setRooms(data.rooms || []);
    } catch {
      toast.error('Failed to load chat rooms');
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  /* ── Select room ── */
  const selectRoom = async (room) => {
    setActiveRoom(room);
    setMessages([]);
    setLoading(true);
    try {
      const { data } = await api.get(`/chat/rooms/${room._id}/messages`);
      setMessages(data.messages || []);
      // Join room channel
      socket?.emit('chat:join', room._id);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  /* ── Send message ── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;

    const text = input.trim();
    setInput('');

    try {
      const { data } = await api.post(`/chat/rooms/${activeRoom._id}/message`, { content: text });
      const newMsg = data.message || { _id: Date.now(), content: text, sender: user, createdAt: new Date().toISOString() };
      setMessages((prev) => [...prev, newMsg]);
      // Emit via socket for real-time delivery
      socket?.emit('chat:message', { ...newMsg, room: activeRoom._id, roomId: activeRoom._id });
      // Update room list
      setRooms((prev) => prev.map((r) =>
        r._id === activeRoom._id ? { ...r, lastMessage: newMsg } : r
      ));
    } catch {
      toast.error('Failed to send message');
    }
  };

  /* ── Typing indicator ── */
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!activeRoom) return;
    socket?.emit('chat:typing', {
      userId: currentUserId,
      userName: user?.name || 'Someone',
      roomId: activeRoom._id,
    });
    // Debounce
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {}, 3000);
  };

  /* ── New chat: fetch users ── */
  const openNewChat = async () => {
    setShowNewChat(true);
    try {
      const { data } = await api.get('/users?limit=100');
      setUsers((data.users || []).filter((u) => (u._id || u.id) !== currentUserId));
    } catch {
      toast.error('Failed to load users');
    }
  };

  const toggleUser = (uid) => {
    setSelectedUsers((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  const createRoom = async () => {
    if (selectedUsers.length === 0) return toast.error('Select at least one user');
    try {
      const { data } = await api.post('/chat/rooms', {
        name: roomName.trim() || undefined,
        participants: selectedUsers,
      });
      setShowNewChat(false);
      setSelectedUsers([]);
      setRoomName('');
      fetchRooms();
      if (data.room) selectRoom(data.room);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    }
  };

  /* ── Helpers ── */
  const getRoomDisplayName = (room) => {
    if (room.name) return room.name;
    const others = (room.participants || []).filter((p) => {
      const pid = typeof p === 'string' ? p : (p._id || p.id);
      return pid !== currentUserId;
    });
    if (others.length === 0) return 'Chat';
    return others.map((p) => (typeof p === 'string' ? 'User' : p.name)).join(', ');
  };

  const getLastMessagePreview = (room) => {
    const lm = room.lastMessage;
    if (!lm) return 'No messages yet';
    const content = typeof lm === 'string' ? lm : (lm.content || lm.text || '');
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activeTyping = typingUsers.filter((t) => t.roomId === activeRoom?._id);

  const getMsgSenderId = (msg) => {
    if (!msg.sender) return null;
    if (typeof msg.sender === 'string') return msg.sender;
    return msg.sender._id || msg.sender.id;
  };

  const getMsgSenderName = (msg) => {
    if (!msg.sender) return 'Unknown';
    if (typeof msg.sender === 'string') return 'User';
    return msg.sender.name || 'User';
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-7rem)] -mx-4 lg:-mx-8 -mb-4 lg:-mb-8 rounded-t-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* ── Sidebar ── */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              className="flex flex-col overflow-hidden shrink-0"
              style={{ background: 'rgba(10,10,25,0.9)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Header + New Chat */}
              <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={openNewChat}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                  + New Chat
                </button>
              </div>

              {/* Room list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {roomsLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl p-3 animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <div className="h-3 rounded w-2/3 mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
                      <div className="h-2 rounded w-full" style={{ background: 'rgba(255,255,255,0.03)' }} />
                    </div>
                  ))
                ) : rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No chat rooms yet</p>
                  </div>
                ) : (
                  rooms.map((room) => {
                    const isActive = activeRoom?._id === room._id;
                    return (
                      <button key={room._id} onClick={() => selectRoom(room)}
                        className="w-full text-left px-3 py-3 rounded-xl transition-all"
                        style={isActive
                          ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }
                          : { border: '1px solid transparent' }}>
                        <div className="flex items-center gap-2.5">
                          {/* Online dot */}
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: isActive ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)' }}>
                              {getRoomDisplayName(room).charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                              style={{ background: '#22c55e', borderColor: 'rgba(10,10,25,0.9)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-medium truncate ${isActive ? 'text-white' : 'text-white/60'}`}>
                              {getRoomDisplayName(room)}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
                              {getLastMessagePreview(room)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col" style={{ background: 'rgba(8,8,20,0.5)' }}>

          {/* Chat header */}
          <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(!showSidebar)}
                className="text-white/30 hover:text-white/60 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {activeRoom ? (
                <div>
                  <h2 className="font-semibold text-white text-sm">{getRoomDisplayName(activeRoom)}</h2>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {activeTyping.length > 0
                      ? `${activeTyping.map((t) => t.userName).join(', ')} typing...`
                      : `${(activeRoom.participants || []).length} participants`}
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="font-semibold text-white text-sm">Team Chat</h2>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>Select a room to start chatting</p>
                </div>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {!activeRoom ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', boxShadow: '0 10px 40px rgba(139,92,246,0.4)' }}>
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </motion.div>
                <p className="text-sm mb-1 text-white/40">Select a conversation or start a new chat</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Messages are delivered in real-time via Socket.io</p>
              </div>
            ) : loading ? (
              /* Loading */
              <div className="flex flex-col items-center justify-center h-full">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
                      style={{ background: '#8b5cf6', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              /* No messages */
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-white/30">No messages yet. Say hello!</p>
              </div>
            ) : (
              /* Message list */
              messages.map((msg, i) => {
                const senderId = getMsgSenderId(msg);
                const isOwn = senderId === currentUserId;
                const senderName = getMsgSenderName(msg);
                const showName = !isOwn && (i === 0 || getMsgSenderId(messages[i - 1]) !== senderId);

                return (
                  <motion.div key={msg._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[75%]">
                      {showName && (
                        <p className="text-[10px] font-semibold mb-1 px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {senderName}
                        </p>
                      )}
                      <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                        style={isOwn
                          ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }
                          : cardStyle}>
                        <span style={!isOwn ? { color: 'rgba(255,255,255,0.8)' } : {}}>
                          {msg.content || msg.text || ''}
                        </span>
                        <p className="text-[9px] mt-1 text-right" style={{ color: isOwn ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Typing indicator */}
            {activeRoom && activeTyping.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 text-sm" style={cardStyle}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: '#8b5cf6', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {activeTyping.map((t) => t.userName).join(', ')} typing...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEnd} />
          </div>

          {/* Input area */}
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <form onSubmit={handleSend} className="flex gap-2">
              <input type="text" value={input} onChange={handleInputChange}
                placeholder={activeRoom ? 'Type a message...' : 'Select a room first...'}
                disabled={!activeRoom}
                className="flex-1 px-5 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all focus:ring-2 focus:ring-violet-500/30"
                style={inputStyle} />
              <button type="submit" disabled={!activeRoom || !input.trim()}
                className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* ── New Chat Modal ── */}
        <AnimatePresence>
          {showNewChat && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowNewChat(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md rounded-2xl p-6"
                style={{ background: 'rgba(15,15,30,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={(e) => e.stopPropagation()}>

                <h3 className="text-lg font-bold text-white mb-1">New Chat</h3>
                <p className="text-xs mb-5" style={{ color: 'rgba(255,255,255,0.3)' }}>Select users to start a conversation</p>

                {/* Room name (optional) */}
                <div className="mb-4">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.35)' }}>Room Name (optional)</label>
                  <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Project Alpha"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none focus:ring-2 focus:ring-violet-500/30"
                    style={inputStyle} />
                </div>

                {/* User picker */}
                <label className="block text-[10px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Select Users ({selectedUsers.length} selected)
                </label>
                <div className="rounded-xl max-h-56 overflow-y-auto p-2 space-y-1 mb-5" style={inputStyle}>
                  {users.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Loading users...</p>
                  ) : (
                    users.map((u) => {
                      const uid = u._id || u.id;
                      const selected = selectedUsers.includes(uid);
                      return (
                        <button key={uid} type="button" onClick={() => toggleUser(uid)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                          style={selected ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' } : { border: '1px solid transparent' }}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: selected ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)' }}>
                            {u.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 truncate">{u.name}</p>
                            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{u.email}</p>
                          </div>
                          {selected && (
                            <svg className="w-4 h-4 shrink-0" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={() => { setShowNewChat(false); setSelectedUsers([]); setRoomName(''); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 transition-all hover:text-white/70"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    Cancel
                  </button>
                  <button onClick={createRoom}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                    Create Chat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
