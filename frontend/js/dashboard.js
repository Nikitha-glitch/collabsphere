document.addEventListener('DOMContentLoaded', async () => {
    // Shared: Display user info if logged in
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userCollegeDisplay = document.getElementById('userCollegeDisplay');
    const user = window.api.getCurrentUser();

    if (userNameDisplay && user) {
        userNameDisplay.textContent = `Welcome, ${user.firstName}`;
        userCollegeDisplay.textContent = `${user.degree} in ${user.major} @ ${user.institution}`;
    }

    // Dashboard Only Logic
    if (window.location.pathname.includes('dashboard.html')) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        await fetchDashboardData(user._id);
    }
});

async function fetchDashboardData(userId) {
    const grid = document.getElementById('myProjectsGrid');
    const reqGrid = document.getElementById('requestsGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="color:var(--text-muted)">Loading your projects...</p>';

    try {
        // According to backend: GET /api/projects/user/:userId
        const res = await window.api.get(`/projects/user/${userId}`);
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
                    <div style="margin-top:10px;">
                        <span class="tag"><i class="fa-solid fa-users"></i> Size: ${p.teamSize?.max || 4}</span>
                        <span class="tag" style="background: rgba(16, 185, 129, 0.15); color: #10B981;">${p.status || 'planning'}</span>
                    </div>
                </div>
            `).join('');
        }

        // Fetch Join Requests
        // According to backend GET /api/join-requests gives requests (might be for user's projects)
        const reqsRes = await window.api.get('/join-requests');
        const requests = reqsRes.data || [];
        
        // Filter requests pointing to projects creator==userId
        const myRequests = requests.filter(r => r.project?.creator === userId && r.status === 'pending');

        if (myRequests.length === 0) {
            reqGrid.innerHTML = '<p style="color:var(--text-muted);">No pending requests found.</p>';
        } else {
            reqGrid.innerHTML = myRequests.map(r => `
                <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:8px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>${r.requester?.firstName} ${r.requester?.lastName}</strong> wants to join <strong>${r.project?.title}</strong>
                            <p style="color:var(--text-muted); font-size:0.85rem; margin-top:5px;">Role: ${r.proposedRole}</p>
                            <p style="font-size:0.85rem; margin-top:5px; font-style:italic;">"${r.coverLetter}"</p>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn btn-secondary" onclick="handleRequest('${r._id}', 'rejected')" style="padding:0.5rem 1rem;">Decline</button>
                            <button class="btn btn-primary" onclick="handleRequest('${r._id}', 'accepted')" style="padding:0.5rem 1rem;">Accept</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

    } catch (err) {
        grid.innerHTML = `<p style="color:#F43F5E">Error loading dashboard: ${err.message}</p>`;
    }
}

window.handleRequest = async (reqId, status) => {
    try {
        await window.api.put(`/join-requests/${reqId}`, { status });
        const user = window.api.getCurrentUser();
        // showToast('Request updated', 'success'); // if imported
        fetchDashboardData(user._id);
    } catch (err) {
        alert(err.message);
    }
};
