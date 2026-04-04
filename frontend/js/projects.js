document.addEventListener('DOMContentLoaded', () => {
    
    // --- CREATE PROJECT LOGIC ---
    const createForm = document.getElementById('createProjectForm');
    const skillInput = document.getElementById('reqSkillInput');
    const addSkillBtn = document.getElementById('addSkillBtn');
    const skillsList = document.getElementById('skillsList');
    
    let requiredSkills = [];

    if (addSkillBtn && skillInput && skillsList) {
        const renderSkills = () => {
            skillsList.innerHTML = requiredSkills.map((s, idx) => `
                <div class="skill-badge">
                    ${s} 
                    <button type="button" onclick="window.removeSkill(${idx})"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `).join('');
        };

        window.removeSkill = (idx) => {
            requiredSkills.splice(idx, 1);
            renderSkills();
        };

        const addSkill = () => {
            const val = skillInput.value.trim();
            if (val && !requiredSkills.includes(val)) {
                requiredSkills.push(val);
                skillInput.value = '';
                renderSkills();
            }
        };

        addSkillBtn.addEventListener('click', addSkill);
        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    }

    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = createForm.querySelector('button[type="submit"]');
            btn.textContent = 'Publishing...';
            btn.disabled = true;

            const payload = {
                title: document.getElementById('title').value.trim(),
                category: document.getElementById('category').value,
                description: document.getElementById('description').value.trim(),
                requiredSkills: requiredSkills,
                teamSize: {
                    min: parseInt(document.getElementById('teamSizeMin').value) || 1,
                    max: parseInt(document.getElementById('teamSizeMax').value) || 4
                }
            };

            try {
                await window.api.post('/projects', payload);
                if (window.showToast) window.showToast('Project Created!', 'success');
                setTimeout(() => window.location.href = 'projects.html', 1000);
            } catch (err) {
                if (window.showToast) window.showToast(err.message, 'error');
                else alert(err.message);
                btn.textContent = 'Publish Project';
                btn.disabled = false;
            }
        });
    }

    // --- BROWSE PROJECTS LOGIC ---
    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid) {
        const fetchProjects = async () => {
            try {
                const res = await window.api.get('/projects');
                const projects = res.data || [];
                
                if (projects.length === 0) {
                    projectsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center;">No projects found. Be the first to create one!</div>';
                    return;
                }

                projectsGrid.innerHTML = projects.map(p => `
                    <div class="glass-panel project-card" onclick="window.location.href='projectDetails.html?id=${p._id}'">
                        <div class="project-header">
                            <h3 style="font-size: 1.25rem;">${p.title}</h3>
                            <span class="category-badge">${p.category}</span>
                        </div>
                        
                        <p style="color:var(--text-muted); font-size:0.9rem; margin-top:10px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
                            ${p.description}
                        </p>
                        
                        <div class="project-skills">
                            ${(p.requiredSkills || []).slice(0,3).map(s => `<span class="tag">${s}</span>`).join('')}
                            ${p.requiredSkills?.length > 3 ? `<span class="tag">+${p.requiredSkills.length - 3}</span>` : ''}
                        </div>
                        
                        <div class="card-footer" onclick="event.stopPropagation()">
                            <div style="font-size:0.85rem; color:var(--text-muted);">
                                <i class="fa-solid fa-users"></i> ${p.teamSize?.max || 4} spots
                            </div>
                            <button class="like-btn" title="Like">
                                <i class="fa-solid fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } catch (err) {
                projectsGrid.innerHTML = `<div style="color:#F43F5E;">Error: ${err.message}</div>`;
            }
        };

        fetchProjects();
    }

    // --- PROJECT DETAILS LOGIC ---
    const detailContainer = document.getElementById('projectDetailsContainer');
    if (detailContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (!projectId) {
            detailContainer.innerHTML = '<h2>Project not found</h2>';
            return;
        }

        const fetchDetails = async () => {
            try {
                const res = await window.api.get(`/projects/${projectId}`);
                const p = res.data;

                document.getElementById('pdTitle').textContent = p.title;
                document.getElementById('pdCategory').textContent = p.category;
                document.getElementById('pdDescription').textContent = p.description;
                document.getElementById('pdCreator').innerHTML = `Created by: <span style="color:white; font-weight:bold;">${p.creator?.firstName || 'Anonymous'} ${p.creator?.lastName || ''}</span>`;
                
                document.getElementById('pdSkills').innerHTML = p.requiredSkills.length 
                    ? p.requiredSkills.map(s => `<span class="tag-pill">${s}</span>`).join('') 
                    : '<span style="color:var(--text-muted)">No specific skills listed.</span>';
                
                document.getElementById('pdTeamSize').textContent = p.teamSize?.max || 4;

                // Handle Team Members (assuming members are populated)
                const members = p.teamMembers || [];
                const membersDiv = document.getElementById('pdMembers');
                membersDiv.innerHTML = members.map(m => `
                    <div class="member-item">
                        <div class="member-avatar">${(m.firstName || 'U')[0]}</div>
                        <div>
                            <strong>${m.firstName} ${m.lastName}</strong>
                            <div style="font-size:0.75rem; color:var(--text-muted)">${m.major || 'Contributor'}</div>
                        </div>
                    </div>
                `).join('');
                if(members.length === 0) membersDiv.innerHTML = '<div class="member-item" style="color:var(--text-muted)">No team members yet.</div>';

                // Handle Join Request Button
                document.getElementById('joinBtn').addEventListener('click', async () => {
                    const coverLetter = document.getElementById('joinCoverLetter').value;
                    try {
                        const btn = document.getElementById('joinBtn');
                        btn.disabled = true;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
                        
                        await window.api.post('/join-requests', { project: projectId, coverLetter });
                        
                        btn.innerHTML = '<i class="fa-solid fa-check"></i> Request Sent';
                        btn.style.background = '#10B981'; // green
                    } catch (err) {
                        alert(err.message);
                        document.getElementById('joinBtn').disabled = false;
                        document.getElementById('joinBtn').innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Join Request';
                    }
                });

            } catch (err) {
                detailContainer.innerHTML = `<h2 style="color:#F43F5E;">Error: ${err.message}</h2>`;
            }
        };

        fetchDetails();
    }
});
