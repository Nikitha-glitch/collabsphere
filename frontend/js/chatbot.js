document.addEventListener('DOMContentLoaded', () => {
    const openChatBtn = document.getElementById('openChatBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');

    if (!openChatBtn) return; // Prevent errors if not on a page with chatbot

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
        msgDiv.textContent = message;
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
            // Check if endpoint exists on backend. 
            // In BACKEND_SETUP.md: POST /api/chatbot/message 
            // Body expects some shape, usually { message: text }
            const response = await window.api.post('/chatbot/message', { message: msgText });
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
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
});
