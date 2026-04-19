import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {

    if (document.getElementById('chatbot-overlay')) return;

    // Inject chatbot HTML globally
    const chatbotHTML = `
    <div id="chatbot-overlay">
        <div class="chatbot-window" id="chatWindow">
            <div class="chatbot-header">
                <div style="width: 35px; height: 35px; background: linear-gradient(135deg, var(--primary), #818CF8); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid fa-robot" style="color: white; font-size: 1.2rem;"></i>
                </div>
                <div>
                    <h4 style="margin:0; font-size: 1rem;">CollabAI Guides</h4>
                    <small style="color: var(--text-muted);">Online</small>
                </div>
            </div>
            <div class="chatbot-messages" id="chatMessages">
                <div class="chat-bubble bot">Hello! I am CollabAI. I can help you navigate the platform, explain features, and answer your project queries. How can I assist you today?</div>
            </div>
            <div class="chatbot-input">
                <textarea id="chatInput" placeholder="Type your message... (Shift+Enter for new line)" rows="1" style="flex: 1; background: rgba(0,0,0,0.2); border: none; padding: 10px 15px; border-radius: 20px; color: white; outline: none; resize: none; overflow-y: hidden; min-height: 40px; font-family: inherit; font-size: inherit;"></textarea>
                <button id="sendChatBtn"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
        <button class="chatbot-btn" id="openChatBtn">
            <i class="fa-solid fa-message"></i>
        </button>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    const openChatBtn = document.getElementById('openChatBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');

    if (!openChatBtn) return; // Prevent errors

    let isChatOpen = false;

    // Toggle chat window
    openChatBtn.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWindow.classList.add('open');
            openChatBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            chatInput.focus();
        } else {
            chatWindow.classList.remove('open');
            openChatBtn.innerHTML = '<i class="fa-solid fa-message"></i>';
        }
    });

    const addMessage = (message, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-bubble ${sender}`;
        // Preserve code indentation if user sent code
        msgDiv.style.whiteSpace = 'pre-wrap';
        
        if (sender === 'bot') {
            msgDiv.innerHTML = message;
        } else {
            msgDiv.textContent = message; // Safe escaping for user input
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSendMessage = async () => {
        const msgText = chatInput.value.trim();
        if (!msgText) return;

        // Add user message
        addMessage(msgText, 'user');
        chatInput.value = '';

        // Typing indicator
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.className = `chat-bubble bot`;
        typingDiv.id = typingId;
        typingDiv.innerHTML = '<span class="spinner" style="width: 15px; height: 15px; display: inline-block; border-width: 2px;"></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // In BACKEND_SETUP.md: POST /api/chatbot/message 
            // Body expects some shape, usually { message: text }
            const response = await api.post('/chatbot/message', { message: msgText });
            document.getElementById(typingId).remove();

            
            // Assuming response contains a 'reply' or 'message' property
            const botReply = response.reply || response.response || response.message || "I'm sorry, I didn't understand the response from the server.";
            addMessage(botReply, 'bot');
        } catch (error) {
            console.error('Chatbot error:', error);
            document.getElementById(typingId).remove();
            
            // Since backend is timing out with DB, provide a fallback UI message
            addMessage("I'm currently unable to connect to the CollabSphere AI brain due to server issues. Try checking your MonogDB connection!", 'bot');
        }
    };

    sendChatBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
            chatInput.style.height = 'auto'; // Reset height
        }
    });

    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });
});
