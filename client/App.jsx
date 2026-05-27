import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Auth from './Auth';
import './App.css';

// Dynamic backend URL - supports both development and production
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sessionToken, setSessionToken] = useState(null);

  // Chat state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState({});
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Refs
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('sessionToken');
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedDisplayName = localStorage.getItem('displayName');

    if (storedToken && storedUserId && storedUsername) {
      setSessionToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);
      setDisplayName(storedDisplayName || storedUsername);
      setIsAuthenticated(true);
    }
  }, []);

  // Initialize Socket.IO after authentication
  useEffect(() => {
    if (!isAuthenticated || !sessionToken || socketRef.current) {
      return;
    }

    socketRef.current = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnectionStatus('connected');
      // Authenticate socket
      socket.emit('authenticate', { sessionToken });
    });

    socket.on('authSuccess', (data) => {
      console.log('✅ Socket authenticated:', data);
    });

    socket.on('authError', (error) => {
      console.error('❌ Socket auth error:', error);
      // Clear stored session if token is invalid
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('displayName');
      setIsAuthenticated(false);
    });

    socket.on('disconnect', () => {
      console.log('⚠️ Socket disconnected');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setConnectionStatus('error');
    });

    socket.on('userList', (userList) => {
      const otherUsers = userList.filter(u => u.userId !== userId);
      setUsers(otherUsers);
    });

    socket.on('conversationSelected', (conversation) => {
      setActiveConversationId(conversation.conversationId);
      setConversations((prev) => ({
        ...prev,
        [conversation.conversationId]: {
          ...prev[conversation.conversationId],
          ...conversation,
          messages: conversation.messages || []
        }
      }));
      setUnreadCounts((prev) => ({ ...prev, [conversation.conversationId]: 0 }));
    });

    socket.on('conversationMessage', ({ conversation, message: msg }) => {
      setConversations((prev) => ({
        ...prev,
        [conversation.conversationId]: {
          ...prev[conversation.conversationId],
          ...conversation,
          messages: [...(prev[conversation.conversationId]?.messages || []), msg]
        }
      }));
      if (conversation.conversationId !== activeConversationId && msg.to === userId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversation.conversationId]: (prev[conversation.conversationId] || 0) + 1
        }));
      }
      setTypingUsers((prev) => ({
        ...prev,
        [conversation.conversationId]: []
      }));
    });

    socket.on('userTyping', ({ conversationId, typingUsernames }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: typingUsernames || []
      }));
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    return () => {
      // Don't disconnect socket - keep it alive
    };
  }, [isAuthenticated, sessionToken, userId]);

  // Fetch initial conversations when authenticated
  useEffect(() => {
    if (!isAuthenticated || !userId || !sessionToken) return;

    const fetchInitialData = async () => {
      try {
        const convsRes = await fetch(`${BACKEND_URL}/api/conversations/${userId}`);
        const convsData = await convsRes.json();

        const convsObj = {};
        convsData.forEach(conv => {
          convsObj[conv.conversationId] = {
            conversationId: conv.conversationId,
            participants: conv.participants,
            otherUser: conv.otherUser,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageTime,
            lastMessageFrom: conv.lastMessageFrom,
            messages: []
          };
        });

        setConversations(convsObj);

        const unreadsRes = await fetch(`${BACKEND_URL}/api/unread/${userId}`);
        const unreadsData = await unreadsRes.json();
        setUnreadCounts(unreadsData);

        console.log('✅ Loaded conversations and unread counts');
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    // Get online users
    if (socketRef.current) {
      socketRef.current.emit('getUsers');
    }

    fetchInitialData();
  }, [isAuthenticated, userId, sessionToken]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId]);

  const handleAuthSuccess = (authData) => {
    setSessionToken(authData.sessionToken);
    setUserId(authData.userId);
    setUsername(authData.username);
    setDisplayName(authData.displayName);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
    setIsAuthenticated(false);
    setSessionToken(null);
    setUserId(null);
    setUsername('');
    setDisplayName('');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setMessage('');
    if (socketRef.current) {
      socketRef.current.emit('selectChat', user.userId);
    }

    const conv = Object.values(conversations).find(
      c => c.participants.includes(userId) && c.participants.includes(user.userId)
    );
    if (conv) {
      setActiveConversationId(conv.conversationId);
      setUnreadCounts((prev) => ({ ...prev, [conv.conversationId]: 0 }));
      setTypingUsers((prev) => ({
        ...prev,
        [conv.conversationId]: []
      }));
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim() && selectedUser && socketRef.current) {
      socketRef.current.emit('privateMessage', {
        toUserId: selectedUser.userId,
        text: message
      });
      setMessage('');
      if (activeConversationId) {
        setTypingUsers((prev) => ({
          ...prev,
          [activeConversationId]: []
        }));
      }
    }
  };

  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    if (selectedUser && newValue.trim().length > 0 && socketRef.current) {
      socketRef.current.emit('typing', { toUserId: selectedUser.userId });
    }
  };

  // Show Auth screen if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} backendUrl={BACKEND_URL} />;
  }

  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;
  const currentMessages = activeConversation?.messages || [];

  const normalizedSearch = userSearch.trim().toLowerCase();
  const recentConversations = Object.values(conversations)
    .filter(conv => conv.participants.includes(userId))
    .map(conv => {
      const otherUserId = conv.participants.find(id => id !== userId);
      const otherUser = conv.otherUser;
      const lastMsg = conv.messages ? conv.messages[conv.messages.length - 1] : null;
      return {
        conversationId: conv.conversationId,
        otherUser,
        lastMsg,
        conversation: conv
      };
    })
    .filter(item =>
      item.otherUser &&
      (!normalizedSearch || item.otherUser.username.toLowerCase().includes(normalizedSearch))
    )
    .sort((a, b) => {
      const aTime = a.lastMsg ? new Date(a.lastMsg.timestamp).getTime() : 0;
      const bTime = b.lastMsg ? new Date(b.lastMsg.timestamp).getTime() : 0;
      return bTime - aTime;
    });

  const filteredUsers = users.filter(user => {
    if (normalizedSearch && !user.username.toLowerCase().includes(normalizedSearch)) {
      return false;
    }
    return !recentConversations.some(rc => rc.otherUser?.userId === user.userId);
  });

  return (
    <div className="split-container" data-theme={theme}>
      {/* Sidebar: Navigation & Controls */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="app-title">ComRigX</div>
          <button className="theme-toggle" onClick={handleThemeToggle} aria-label="Toggle theme">
            {theme === 'light' ? '🌞' : '🌙'}
          </button>
          <div className="user-search">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search contacts"
              aria-label="Search contacts"
            />
          </div>
        </div>

        <div className="sidebar-middle">
          <div className="contacts-label">Contacts</div>
          <div className="users-list">
            {recentConversations.length === 0 && filteredUsers.length === 0 ? (
              <p className="no-users">No users available</p>
            ) : (
              <>
                {recentConversations.map(({ conversationId, otherUser, lastMsg }) => {
                  const isOnline = users.some(u => u.userId === otherUser?.userId);
                  const unread = unreadCounts[conversationId] || 0;
                  return (
                    <div
                      key={conversationId}
                      className={`user-item${selectedUser?.userId === otherUser?.userId ? ' active' : ''}`}
                      onClick={() => handleSelectUser(otherUser)}
                      aria-current={selectedUser?.userId === otherUser?.userId ? 'true' : undefined}
                    >
                      <span className={`online-dot${isOnline ? '' : ' offline'}`} />
                      <span style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{otherUser?.displayName || otherUser?.username}</span>
                        <br />
                        <span className="sidebar-last-message">
                          {lastMsg
                            ? (lastMsg.text.length > 28 ? lastMsg.text.slice(0, 28) + '…' : lastMsg.text)
                            : 'No messages yet'}
                        </span>
                      </span>
                      {unread > 0 && <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>}
                    </div>
                  );
                })}

                {filteredUsers.map((user) => (
                  <div
                    key={user.userId}
                    className={`user-item${selectedUser?.userId === user.userId ? ' active' : ''}`}
                    onClick={() => handleSelectUser(user)}
                    aria-current={selectedUser?.userId === user.userId ? 'true' : undefined}
                  >
                    <span className="online-dot" />
                    <span style={{ flex: 1, fontWeight: 600 }}>
                      {user.displayName || user.username}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="current-user">
            <div style={{ fontWeight: 600 }}>{displayName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>@{username}</div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-area">
        <header className="chat-header">
          {selectedUser ? (
            <>
              <span className="chat-user-name">
                {selectedUser.displayName || selectedUser.username}
              </span>
              <span className="chat-user-id">@{selectedUser.username}</span>
            </>
          ) : (
            <span className="chat-user-name chat-placeholder">Select a contact</span>
          )}
        </header>

        <section className="messages">
          {selectedUser && currentMessages.length > 0 ? (
            currentMessages.map((msg, i) => (
              <div key={i} className={`message ${msg.from === userId ? 'sent' : 'received'}`}>
                <span className="message-username">
                  {msg.fromDisplayName || msg.fromUsername}
                </span>
                <span className="message-text">{msg.text}</span>
                <span className="message-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : selectedUser ? (
            <div className="no-chat-selected">
              <p>No messages yet. Say hi!</p>
            </div>
          ) : (
            <div className="no-chat-selected">
              <p>Select a contact to start chatting</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </section>

        {selectedUser && activeConversationId && (typingUsers[activeConversationId] || []).length > 0 && (
          <div className="typing-indicator">
            {(typingUsers[activeConversationId] || []).map((username) => (
              <div key={username} className="typing-text">{username} is typing…</div>
            ))}
          </div>
        )}

        <form className="input-form" onSubmit={handleSend}>
          <input
            value={message}
            onChange={handleMessageChange}
            placeholder={selectedUser ? 'Type a message...' : 'Select a contact to chat'}
            disabled={!selectedUser}
          />
          <button type="submit" disabled={!selectedUser || !message.trim()}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

export default App;
