import { api } from './api.js';

let activeTab = 'received';
let allRequests = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Initial check for auth
    const user = api.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    setupEventListeners();
    await loadRequests();
});

function setupEventListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTab = btn.dataset.tab;
            renderRequests();
        });
    });
}

async function loadRequests() {
    const container = document.getElementById('requestsContainer');
    try {
        const response = await api.get('/join-requests');
        allRequests = response.data || [];
        renderRequests();
    } catch (error) {
        console.error('Error loading requests:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation mb-4" style="font-size: 2rem; color: var(--error);"></i>
                <p>Failed to load requests. Please try again later.</p>
            </div>
        `;
    }
}

function renderRequests() {
    const container = document.getElementById('requestsContainer');
    const user = api.getCurrentUser();
    const uid = api.token;

    let filtered = [];
    if (activeTab === 'received') {
        // Current user is the owner of the project
        filtered = allRequests.filter(req => req.projectCreatorId === uid || req.project?.creator === uid);
    } else {
        // Current user is the requester
        filtered = allRequests.filter(req => req.requesterId === uid);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-envelope-open mb-4" style="font-size: 2rem;"></i>
                <p>No ${activeTab === 'received' ? 'received requests' : 'sent applications'} found.</p>
            </div>
        `;
        return;
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = filtered.map(req => `
        <div class="request-card animate-fade-in-up">
            <span class="status-badge status-${req.status || 'pending'}">${req.status || 'pending'}</span>
            
            <div class="request-header">
                <h3>${activeTab === 'received' ? req.requester?.firstName + ' ' + req.requester?.lastName : req.projectTitle || req.project?.title}</h3>
                <p style="color: var(--text-muted)">
                    ${activeTab === 'received' ? `Applied to: <strong>${req.projectTitle || req.project?.title}</strong>` : `Application to <strong>${req.projectTitle || req.project?.title}</strong>`}
                </p>
            </div>

            <div class="request-details">
                <div class="detail-item">
                    <label>${activeTab === 'received' ? 'Requester Institution' : 'Project Creator'}</label>
                    <p>${activeTab === 'received' ? req.requester?.institution || 'Not specified' : 'Project Owner'}</p>
                </div>
                <div class="detail-item">
                    <label>Applied On</label>
                    <p>${new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="detail-item" style="grid-column: span 2;">
                    <label>Message / Cover Letter</label>
                    <p>${req.coverLetter || 'No message provided.'}</p>
                </div>
                ${req.skills ? `
                <div class="detail-item" style="grid-column: span 2;">
                    <label>Relevant Skills</label>
                    <p>${req.skills}</p>
                </div>` : ''}
            </div>

            ${activeTab === 'received' && req.status === 'pending' ? `
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="handleRequestAction('${req._id}', 'accepted')">
                        <i class="fa-solid fa-check"></i> Accept Request
                    </button>
                    <button class="btn btn-secondary" onclick="handleRequestAction('${req._id}', 'rejected')">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                </div>
            ` : ''}

            ${activeTab === 'sent' && req.status === 'pending' ? `
                <div class="action-buttons">
                    <button class="btn btn-secondary" disabled>
                        <i class="fa-solid fa-clock"></i> Waiting for approval
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Attach to window so onclick works with module scope
window.handleRequestAction = async (id, status) => {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        await api.put(`/join-requests/${id}`, { status });
        api.showToast(`Request ${status} successfully!`, 'success');
        
        // Refresh local data to reflect change immediately
        const req = allRequests.find(r => r._id === id);
        if (req) req.status = status;
        renderRequests();
    } catch (error) {
        api.showToast(error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};
