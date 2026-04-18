import { api } from './api.js';

// Session protection
if (!api.token && window.location.pathname.includes('dashboard.html')) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {

    // Shared: Display user info if logged in
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userCollegeDisplay = document.getElementById('userCollegeDisplay');
    const user = api.getCurrentUser();


    if (userNameDisplay && user) {
        userNameDisplay.textContent = `Welcome, ${user.firstName}`;
        userCollegeDisplay.textContent = `${user.degree} in ${user.major} @ ${user.institution}`;
    }

    // Dashboard Only Logic
    if (window.location.pathname.includes('dashboard.html')) {
        if (user) {
            await fetchDashboardData(user._id);
        }
    }
});

async function fetchDashboardData(userId) {
    const grid = document.getElementById('myProjectsGrid');
    const joinedGrid = document.getElementById('joinedProjectsGrid');
    const reqGrid = document.getElementById('requestsGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="color:var(--text-muted)">Loading your projects...</p>';

    try {
        // According to backend: GET /api/projects/user/:userId
        const res = await api.get(`/projects/user/${userId}`);

        const projects = res.data || [];

        if (projects.length === 0) {
            grid.innerHTML = `
                <div class="glass-panel" style="padding: 2rem; grid-column: 1/-1; text-align:center;">
                    <i class="fa-solid fa-folder-open mb-4" style="font-size:2rem; color:var(--text-muted);"></i>
                    <p>You haven't created any projects yet.</p>
                    <a href="createProject.html" class="btn btn-primary mt-4">Create One</a>
                </div>
            `;
        } else {
            grid.innerHTML = projects.map(p => `
                <div class="glass-panel project-card" onclick="window.location.href='projectDetails.html?id=${p._id}'">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="font-size: 1.2rem;">${p.title}</h4>
                    </div>
                    <p style="color:var(--text-muted); font-size:0.9rem; margin-top:5px; flex:1;">
                        ${p.description.substring(0, 100)}...
                    </p>
                    <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span class="tag"><i class="fa-solid fa-users"></i> Size: ${p.teamSize?.max || 4}</span>
                            <span class="tag" style="background: rgba(16, 185, 129, 0.15); color: #10B981;">${p.status || 'planning'}</span>
                        </div>
                        <button class="btn btn-secondary" onclick="event.stopPropagation(); window.location.href='collaboration.html?projectId=${p._id}'" style="padding: 5px 10px; font-size: 0.75rem;">
                            <i class="fa-solid fa-comments"></i> Hub
                        </button>
                    </div>
                </div>
            `).join('');
        }

        // Fetch Joined Projects
        const joinedRes = await api.get(`/projects/joined/${userId}`);
        const joinedProjects = joinedRes.data || [];

        if (joinedGrid) {
            if (joinedProjects.length === 0) {
                joinedGrid.innerHTML = `
                    <div class="glass-panel" style="padding: 2rem; grid-column: 1/-1; text-align:center;">
                        <p style="color:var(--text-muted);">You haven't joined any projects yet.</p>
                        <a href="projects.html" class="btn btn-secondary mt-4" style="padding: 0.5rem 1rem;">Explore Ideas</a>
                    </div>
                `;
            } else {
                joinedGrid.innerHTML = joinedProjects.map(p => `
                    <div class="glass-panel project-card border-left-accent" onclick="window.location.href='collaboration.html?projectId=${p._id}'" style="border-left: 4px solid var(--primary);">
                        <div style="display:flex; justify-content:space-between;">
                            <h4 style="font-size: 1.2rem;">${p.title}</h4>
                            <span class="tag" style="background: rgba(16, 185, 129, 0.15); color: #10B981; margin:0;">Active</span>
                        </div>
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-top:5px; flex:1;">
                            Lead by: ${p.creator?.firstName} ${p.creator?.lastName}
                        </p>
                        <div style="margin-top:10px; display:flex; justify-content:flex-end;">
                            <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='collaboration.html?projectId=${p._id}'" style="padding: 5px 15px; font-size: 0.8rem;">
                                <i class="fa-solid fa-comments"></i> Open Hub
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Fetch Join Requests
        // According to backend GET /api/join-requests gives requests (might be for user's projects)
        const reqsRes = await api.get('/join-requests');

        const requests = reqsRes.data || [];
        
        // Filter requests pointing to projects creator==userId
        const myRequests = requests.filter(r => r.project?.creator === userId && r.status === 'pending');

        if (myRequests.length === 0) {
            reqGrid.innerHTML = `
                <div style="text-align:center; padding: 1rem;">
                    <i class="fa-solid fa-circle-check mb-2" style="color:var(--primary); font-size:1.5rem;"></i>
                    <p style="color:var(--text-muted); font-size:0.9rem;">No recent requests.</p>
                </div>
            `;
        } else {
            reqGrid.innerHTML = myRequests.map(r => `
                <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="flex:1;">
                            <strong>${r.requester?.firstName} ${r.requester?.lastName}</strong> wants to join <strong>${r.project?.title}</strong>
                            <div style="font-size:0.85rem; color:var(--primary); margin-top:4px;">
                                <i class="fa-solid fa-graduation-cap"></i> ${r.requester?.year} @ ${r.requester?.institution}
                            </div>
                            <div style="margin-top:10px;">
                                <p style="font-size:0.85rem; color:var(--text-muted); font-weight:600; margin-bottom:2px;">Interest:</p>
                                <p style="font-size:0.85rem; font-style:italic;">"${r.coverLetter}"</p>
                            </div>
                            <div style="margin-top:10px;">
                                <p style="font-size:0.85rem; color:var(--text-muted); font-weight:600; margin-bottom:2px;">Technical Skills:</p>
                                <div style="display:flex; flex-wrap:wrap; gap:5px;">
                                    ${(r.requester?.skills || '').split(',').map(s => `<span class="tag" style="font-size:0.75rem;">${s.trim()}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-secondary" onclick="handleRequest('${r._id}', 'rejected')" style="padding:0.5rem 1rem;">Decline</button>
                            <button class="btn btn-primary" onclick="handleRequest('${r._id}', 'accepted', '${r.project?._id}')" style="padding:0.5rem 1rem;">Accept</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

    } catch (err) {
        grid.innerHTML = `<p style="color:#F43F5E">Error loading dashboard: ${err.message}</p>`;
    }
}

window.handleRequest = async (reqId, status, projectId = null) => {
    try {
        await api.put(`/join-requests/${reqId}`, { status });
        
        if (status === 'accepted') {
            api.showToast('Request Accepted! Opening Collaboration Hub...', 'success');
            setTimeout(() => {
                window.location.href = `collaboration.html?projectId=${projectId}`;
            }, 1000);
        } else {
            api.showToast('Request declined.', 'info');
            const user = api.getCurrentUser();
            fetchDashboardData(user._id);
        }
    } catch (err) {
        alert(err.message);
    }
};

