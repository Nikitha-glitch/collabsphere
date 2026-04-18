import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    const user = api.getCurrentUser();

    if (!projectId || !user) {
        window.location.href = 'dashboard.html';
        return;
    }

    // UI Elements
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMsgBtn = document.getElementById('sendMsgBtn');
    const codeArea = document.getElementById('codeArea');
    const saveCodeBtn = document.getElementById('saveCodeBtn');
    const projectTitleHeader = document.getElementById('projectTitleHeader');
    const teamList = document.getElementById('teamList');
    const projCategory = document.getElementById('projCategory');

    let currentProject = null;

    // Fetch Project and Team Info
    const fetchProjectDetails = async () => {
        try {
            const res = await api.get(`/projects/${projectId}`);
            currentProject = res.data;
            
            projectTitleHeader.textContent = currentProject.title;
            projCategory.textContent = currentProject.category;

            // Render Team
            const members = currentProject.teamMembers || [];
            // Add creator too
            const allMembers = [
                { firstName: currentProject.creator.firstName, lastName: currentProject.creator.lastName, isCreator: true },
                ...members
            ];

            teamList.innerHTML = allMembers.map(m => `
                <div class="team-member">
                    <div class="member-avatar" style="${m.isCreator ? 'background:#F59E0B' : ''}">
                        ${m.firstName[0]}
                    </div>
                    <div>
                        <div style="font-size:0.9rem; font-weight:600;">${m.firstName} ${m.lastName}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted)">${m.isCreator ? 'Lead' : 'Contributor'}</div>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error('Failed to load project details', err);
            api.showToast('Failed to load project info', 'error');
        }
    };

    // Chat Logic
    const renderMessages = (messages) => {
        chatMessages.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 10px;">
                Development hub for ${currentProject?.title}
            </div>
        `;

        messages.forEach(msg => {
            const isMine = msg.senderId === user._id;
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isMine ? 'sent' : 'received'}`;
            msgDiv.innerHTML = `
                <div style="font-size: 0.75rem; opacity: 0.8; margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>${msg.senderName}</span>
                    <span>${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>${msg.text}</div>
            `;
            chatMessages.appendChild(msgDiv);
        });

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        try {
            await api.post('/chat', {
                projectId,
                senderId: user._id,
                senderName: `${user.firstName} ${user.lastName}`,
                text
            });
            chatInput.value = '';
            // No need to manually reload, the real-time listener will trigger
        } catch (err) {
            console.error("Send message error:", err);
            api.showToast(`Message failed: ${err.message}`, 'error');
        }
    };

    // Code Workspace Logic
    const loadCode = async () => {
        try {
            const res = await api.get(`/code/${projectId}`);
            if (res.data) {
                codeArea.value = res.data.code;
            }
        } catch (err) {
            console.error('Failed to load code', err);
        }
    };

    const saveCode = async () => {
        try {
            saveCodeBtn.disabled = true;
            saveCodeBtn.textContent = 'Saving...';
            await api.put(`/code/${projectId}`, { code: codeArea.value });
            api.showToast('Workspace saved!', 'success');
        } catch (err) {
            console.error('Failed to save code:', err);
            api.showToast(`Failed to save: ${err.message}`, 'error');
        } finally {
            saveCodeBtn.disabled = false;
            saveCodeBtn.textContent = 'Save Changes';
        }
    };

    // Initial Load
    await fetchProjectDetails();
    await loadCode();

    // Start Real-Time Chat Listener
    api.listenToChat(projectId, (messages, sharedCode) => {
        renderMessages(messages);
        
        // Real-time code syncing
        if (sharedCode !== undefined && codeArea.value !== sharedCode) {
            codeArea.value = sharedCode;
            // Visual indicator
            codeArea.style.borderColor = '#10B981';
            setTimeout(() => codeArea.style.borderColor = '#1e293b', 1000);
        }
    });

    // Event Listeners
    sendMsgBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    saveCodeBtn.addEventListener('click', saveCode);

});
