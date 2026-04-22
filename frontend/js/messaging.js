import { api } from './api.js';

// Socket.IO connection
const socket = window.io ? io('http://localhost:5002', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
}) : {
  emit: () => {},
  on: () => {},
  off: () => {}
};

let currentUserId = null;
let currentConversationId = null;
let typingTimeout = null;
let unsubscribeMessages = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is logged in
  if (!api.token) {
    window.location.href = 'login.html';
    return;
  }

  // Get current user
  const currentUser = api.getCurrentUser();
  if (!currentUser) {
    try {
      const res = await api.get('/auth/me');
      api.setCurrentUser(res.data);
      currentUserId = res.data._id;
    } catch (error) {
      window.location.href = 'login.html';
    }
  } else {
    currentUserId = currentUser._id;
  }

  // Setup Socket.IO
  socket.emit('user:online', currentUserId);

  // Load conversations
  await loadConversations();

  // Setup event listeners
  setupEventListeners();
  setupSocketListeners();
});

// Load all conversations
async function loadConversations() {
  try {
    const res = await api.get(`/messages/conversations/${currentUserId}`);
    const conversations = res.data;

    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = '';

    if (conversations.length === 0) {
      conversationsList.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted);">
          <p>No conversations yet. Start messaging with someone!</p>
        </div>
      `;
      return;
    }

    conversations.forEach((conv) => {
      const otherParticipant = conv.participants.find(p => p._id !== currentUserId);
      const displayName = otherParticipant 
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : conv.name || 'Conversation';

      const firstInitial = displayName.charAt(0).toUpperCase();

      const convItem = document.createElement('div');
      convItem.className = 'conversation-item';
      convItem.dataset.conversationId = conv._id;
      convItem.dataset.participantId = otherParticipant?._id || '';

      const lastMessagePreview = conv.lastMessage?.content?.substring(0, 30) || 'No messages yet';

      convItem.innerHTML = `
        <div class="conversation-avatar">${firstInitial}</div>
        <div class="conversation-info">
          <div class="conversation-name">${displayName}</div>
          <div class="conversation-preview">${lastMessagePreview}</div>
        </div>
      `;

      convItem.addEventListener('click', () => {
        loadConversation(conv._id, displayName, otherParticipant);
      });

      conversationsList.appendChild(convItem);
    });
  } catch (error) {
    console.error('Error loading conversations:', error);
    api.showToast('Failed to load conversations', 'error');
  }
}

// Load specific conversation
async function loadConversation(conversationId, displayName, participant) {
  currentConversationId = conversationId;

  // Update active state
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-conversation-id="${conversationId}"]`)?.classList.add('active');

  // Update message header
  const firstInitial = displayName.charAt(0).toUpperCase();
  document.getElementById('selectedUserAvatar').textContent = firstInitial;
  document.getElementById('selectedUserName').textContent = displayName;
  document.getElementById('messageHeader').style.display = 'flex';
  document.getElementById('messageInputArea').style.display = 'block';

  // Load messages
  try {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '<div style="color: var(--text-muted);">Loading messages...</div>';

    if (unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = api.listenToMessages(conversationId, (messages) => {
      messageList.innerHTML = '';

      if (messages.length === 0) {
        messageList.innerHTML = '<div style="color: var(--text-muted); text-align:center; margin:auto;">No messages yet.</div>';
        return;
      }

      messages.forEach((msg) => {
        displayMessage(msg);
      });

      messageList.scrollTop = messageList.scrollHeight;
    });
  } catch (error) {
    console.error('Error loading messages:', error);
    api.showToast('Failed to load messages', 'error');
  }
}

// Display a message in the UI
function displayMessage(message) {
  const messageList = document.getElementById('messageList');
  const isSent = message.sender._id === currentUserId;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
  messageDiv.dataset.messageId = message._id;

  if (message.messageType === 'code') {
    const codeBubble = document.createElement('div');
    codeBubble.className = `message-bubble code ${isSent ? 'sent' : 'received'}`;
    
    codeBubble.innerHTML = `
      <div class="code-header">
        <span class="code-language">${message.codeData.language}</span>
        <button class="copy-code-btn" onclick="copyCode(this)">
          <i class="fa-solid fa-copy"></i> Copy
        </button>
      </div>
      <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(message.codeData.code)}</pre>
      <div class="message-time">${formatTime(message.createdAt)}</div>
    `;

    messageDiv.appendChild(codeBubble);
  } else {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
    bubble.textContent = message.content;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = formatTime(message.createdAt);

    messageDiv.appendChild(bubble);
    messageDiv.appendChild(time);
  }

  messageList.appendChild(messageDiv);
  messageList.scrollTop = messageList.scrollHeight;
}

// Setup event listeners
function setupEventListeners() {
  const messageInput = document.getElementById('messageInput');
  const sendMessageBtn = document.getElementById('sendMessageBtn');
  const codeShareBtn = document.getElementById('codeShareBtn');
  const closeCodeEditorBtn = document.getElementById('closeCodeEditorBtn');
  const sendCodeBtn = document.getElementById('sendCodeBtn');

  // Send message on button click
  sendMessageBtn.addEventListener('click', sendMessage);

  // Send message on Enter key
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  // Code share toggle
  codeShareBtn.addEventListener('click', () => {
    const codeEditor = document.getElementById('codeEditor');
    codeEditor.classList.toggle('active');
    if (codeEditor.classList.contains('active')) {
      document.getElementById('codeInput').focus();
    }
  });

  closeCodeEditorBtn.addEventListener('click', () => {
    document.getElementById('codeEditor').classList.remove('active');
  });

  // Send code
  sendCodeBtn.addEventListener('click', sendCode);

  // Typing indicator
  messageInput.addEventListener('input', () => {
    socket.emit('typing:start', currentConversationId, currentUserId);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing:stop', currentConversationId, currentUserId);
    }, 3000);
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await api.clearToken();
    socket.emit('user:offline', currentUserId);
    window.location.href = 'login.html';
  });
}

// Setup Socket.IO listeners
function setupSocketListeners() {
  // New message received
  socket.on(`message:new:${currentConversationId}`, (message) => {
    if (message.conversationId === currentConversationId) {
      displayMessage(message);
    }
  });

  // Typing indicators
  socket.on(`typing:${currentConversationId}`, (data) => {
    const { userId, isTyping } = data;
    if (userId === currentUserId) return;

    let typingIndicator = document.getElementById(`typing-${userId}`);
    if (isTyping && !typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.id = `typing-${userId}`;
      typingIndicator.className = 'typing-indicator';
      typingIndicator.innerHTML = `
        <span>Someone is typing</span>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      document.getElementById('messageList').appendChild(typingIndicator);
    } else if (!isTyping && typingIndicator) {
      typingIndicator.remove();
    }
  });

  // User online/offline status
  socket.on('users:online', (onlineUsers) => {
    const participantId = document.querySelector('.conversation-item.active')?.dataset.participantId;
    if (participantId) {
      const userStatus = document.getElementById('userStatus');
      userStatus.textContent = onlineUsers.includes(participantId) ? '🟢 Online' : '⚫ Offline';
    }
  });
}

// Send message
async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const content = messageInput.value.trim();

  if (!content || !currentConversationId) return;

  try {
    const res = await api.post('/messages', {
      conversationId: currentConversationId,
      senderId: currentUserId,
      content,
      messageType: 'text',
    });

    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Emit through socket for real-time update
    socket.emit('message:send', {
      conversationId: currentConversationId,
      senderId: currentUserId,
      content,
      messageType: 'text',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    api.showToast('Failed to send message', 'error');
  }
}

// Send code
async function sendCode() {
  const codeInput = document.getElementById('codeInput');
  const codeLanguage = document.getElementById('codeLanguage');
  const code = codeInput.value.trim();

  if (!code || !currentConversationId) return;

  try {
    const res = await api.post('/messages', {
      conversationId: currentConversationId,
      senderId: currentUserId,
      content: `Shared code (${codeLanguage.value})`,
      messageType: 'code',
      codeData: {
        language: codeLanguage.value,
        code: code,
      },
    });

    codeInput.value = '';
    document.getElementById('codeEditor').classList.remove('active');

    socket.emit('message:send', {
      conversationId: currentConversationId,
      senderId: currentUserId,
      content: `Shared code (${codeLanguage.value})`,
      messageType: 'code',
      codeData: res.data.codeData,
    });
  } catch (error) {
    console.error('Error sending code:', error);
    api.showToast('Failed to send code', 'error');
  }
}

// Helper functions
function formatTime(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

window.copyCode = function(button) {
  const code = button.closest('.message-bubble').querySelector('pre').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 2000);
  });
};

// Update current conversation when changed
setInterval(() => {
  const activeItem = document.querySelector('.conversation-item.active');
  if (activeItem) {
    const conversationId = activeItem.dataset.conversationId;
    if (conversationId !== currentConversationId) {
      // Listen to new messages from this conversation
      socket.off(`message:new:${currentConversationId}`);
      socket.on(`message:new:${conversationId}`, (message) => {
        if (message.conversationId === conversationId) {
          displayMessage(message);
        }
      });
    }
  }
}, 1000);

export { loadConversations, loadConversation };
