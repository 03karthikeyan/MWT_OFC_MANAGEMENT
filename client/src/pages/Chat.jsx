import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import { getChatUsers, getChatHistory, sendChatMessage, markChatRead } from '../services/api';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineMagnifyingGlass,
  HiOutlineUserCircle,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const fetchUsersList = async () => {
    try {
      setLoadingUsers(true);
      const res = await getChatUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching chat users:', err);
      toast.error('Failed to load team contacts');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  // Handle selected user message history
  useEffect(() => {
    if (!selectedUser) return;

    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoadingMessages(true);
        const res = await getChatHistory(selectedUser._id);
        if (isMounted) {
          setMessages(res.data.messages || []);
          markChatRead(selectedUser._id).catch(() => {});
          // Update unread count in contact list
          setUsers((prev) =>
            prev.map((u) => (u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u))
          );
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load chat history');
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [selectedUser]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Real-time socket events for chat
  useEffect(() => {
    const handleNewMessage = (msg) => {
      const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId;
      const receiverId = typeof msg.receiverId === 'object' ? msg.receiverId?._id : msg.receiverId;

      if (
        selectedUser &&
        (senderId === selectedUser._id || (senderId === user._id && receiverId === selectedUser._id))
      ) {
        setMessages((prev) => {
          // Avoid duplicate
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        if (senderId === selectedUser._id) {
          markChatRead(selectedUser._id).catch(() => {});
        }
      }

      // Update last message in users list
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === senderId || u._id === receiverId) {
            const isCurrentChat = selectedUser && selectedUser._id === u._id;
            return {
              ...u,
              lastMessage: msg.content,
              lastMessageTime: msg.createdAt,
              unreadCount: isCurrentChat || senderId === user._id ? u.unreadCount : (u.unreadCount || 0) + 1,
            };
          }
          return u;
        })
      );
    };

    const handleUserTyping = ({ senderId }) => {
      if (selectedUser && selectedUser._id === senderId) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = ({ senderId }) => {
      if (selectedUser && selectedUser._id === senderId) {
        setIsTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [selectedUser, user]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!selectedUser) return;

    socket.emit('typing', { senderId: user._id, receiverId: selectedUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { senderId: user._id, receiverId: selectedUser._id });
    }, 1500);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    const content = inputText.trim();
    setInputText('');
    socket.emit('stop_typing', { senderId: user._id, receiverId: selectedUser._id });

    try {
      const res = await sendChatMessage({
        receiverId: selectedUser._id,
        content,
      });

      const newMsg = res.data.message;
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? { ...u, lastMessage: content, lastMessageTime: new Date().toISOString() }
            : u
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.jobRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Contact List Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">Direct Messages</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              {users.length} Team
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, role or team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100/70 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {loadingUsers ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Loading Contacts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <HiOutlineUserCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No team members found</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUser?._id === u._id;
              return (
                <button
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3.5 group relative ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-semibold'
                      : 'hover:bg-white bg-transparent text-slate-700 hover:shadow-sm'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black uppercase overflow-hidden border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-white text-indigo-600 border-slate-200 shadow-sm'
                      }`}
                    >
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name?.charAt(0)
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {u.name}
                      </p>
                      {u.lastMessageTime && (
                        <span className={`text-[9px] font-semibold ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {new Date(u.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {u.lastMessage || u.jobRole || 'Available for chat'}
                    </p>
                  </div>

                  {u.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                      {u.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Messages Panel */}
      <div className={`flex-1 flex flex-col bg-white ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            {/* Active Header */}
            <div className="p-4 md:px-6 border-b border-slate-200 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  ←
                </button>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 overflow-hidden shadow-sm">
                  {selectedUser.profilePicture ? (
                    <img src={selectedUser.profilePicture} alt={selectedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    selectedUser.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">{selectedUser.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedUser.jobRole || selectedUser.department || selectedUser.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Active
                </span>
              </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 bg-slate-50/30">
              {loadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Decrypting conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                    <HiOutlineSparkles className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                    Start a Conversation
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs font-medium">
                    Send a direct message to {selectedUser.name} to collaborate in real-time.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe =
                    (typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId) === user._id;
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <div className="w-7 h-7 rounded-xl bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden">
                          {selectedUser.profilePicture ? (
                            <img src={selectedUser.profilePicture} alt="" className="w-full h-full object-cover" />
                          ) : (
                            selectedUser.name?.charAt(0)
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] md:max-w-[65%] rounded-3xl px-4 py-3 shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-bold ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <HiOutlineCheckCircle className="w-3 h-3 text-indigo-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold italic pl-10">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                  <span>{selectedUser.name} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder={`Message ${selectedUser.name}...`}
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-slate-100/80 border border-slate-200 px-5 py-3.5 rounded-2xl text-xs md:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-md shadow-indigo-200 flex items-center justify-center cursor-pointer"
                >
                  <HiOutlinePaperAirplane className="w-5 h-5 -rotate-45 -translate-y-0.5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-5 shadow-sm">
              <HiOutlineChatBubbleLeftRight className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
              Select a Team Member
            </h3>
            <p className="text-xs text-slate-400 max-w-sm font-medium">
              Choose a contact from the left list to view chat history and start real-time messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
