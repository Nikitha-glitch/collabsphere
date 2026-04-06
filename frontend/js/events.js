import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {


    // --- CREATE EVENT LOGIC ---
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = createEventForm.querySelector('button[type="submit"]');
            btn.textContent = 'Publishing...';
            btn.disabled = true;

            const payload = {
                title: document.getElementById('title').value.trim(),
                eventType: document.getElementById('eventType').value,
                category: document.getElementById('category').value,
                description: document.getElementById('description').value.trim(),
                startDate: new Date(document.getElementById('startDate').value).toISOString(),
                endDate: new Date(document.getElementById('endDate').value).toISOString(),
                capacity: parseInt(document.getElementById('capacity').value) || 100,
                registrationDeadline: new Date(document.getElementById('registrationDeadline').value).toISOString()
            };

            try {
                await api.post('/events', payload);
                if (window.showToast) window.showToast('Event Created Successfully!', 'success');
                setTimeout(() => window.location.href = 'events.html', 1000);

            } catch (err) {
                if (window.showToast) window.showToast(err.message, 'error');
                else alert(err.message);
                btn.textContent = 'Publish Event';
                btn.disabled = false;
            }
        });
    }

    // --- BROWSE EVENTS LOGIC ---
    const eventsGrid = document.getElementById('eventsGrid');
    if (eventsGrid) {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/events');
                const events = res.data || [];

                
                if (events.length === 0) {
                    eventsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center;">No upcoming events.</div>';
                    return;
                }

                eventsGrid.innerHTML = events.map(e => `
                    <div class="glass-panel event-card" onclick="window.location.href='eventDetails.html?id=${e._id}'">
                        <div class="event-date">
                            <i class="fa-regular fa-calendar"></i> ${new Date(e.startDate).toLocaleDateString()}
                        </div>
                        <h3 style="font-size: 1.25rem;">${e.title}</h3>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                            <span class="event-type-badge">${e.eventType}</span>
                            <span style="color:var(--text-muted); font-size:0.8rem;"><i class="fa-solid fa-users"></i> ${e.capacity}</span>
                        </div>
                    </div>
                `).join('');
            } catch (err) {
                eventsGrid.innerHTML = `<div style="color:#F43F5E;">Error: ${err.message}</div>`;
            }
        };

        fetchEvents();
    }

    // --- EVENT DETAILS LOGIC ---
    const eventHero = document.getElementById('eventHero');
    if (eventHero) {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) return;

        const fetchDetails = async () => {
            try {
                const res = await api.get(`/events/${eventId}`);
                const ev = res.data;


                document.getElementById('edTitle').textContent = ev.title;
                document.getElementById('edType').textContent = ev.eventType.toUpperCase();
                document.getElementById('edOrganizer').textContent = `${ev.organizer?.firstName || 'Unknown'} ${ev.organizer?.lastName || ''}`;
                document.getElementById('edDescription').textContent = ev.description;
                document.getElementById('edStart').textContent = new Date(ev.startDate).toLocaleString();
                document.getElementById('edEnd').textContent = new Date(ev.endDate).toLocaleString();
                document.getElementById('edCapacity').textContent = ev.capacity;

                const regBtn = document.getElementById('registerEventBtn');
                regBtn.addEventListener('click', async () => {
                    try {
                        regBtn.disabled = true;
                        regBtn.textContent = 'Registering...';
                        await api.post(`/events/${eventId}/register`);
                        regBtn.textContent = 'Registered Complete';

                        regBtn.style.background = '#10B981';
                    } catch(err) {
                        alert(err.message);
                        regBtn.disabled = false;
                        regBtn.textContent = 'Register Now';
                    }
                });
            } catch (err) {
                document.getElementById('edTitle').innerHTML = `<h2 style="color:#F43F5E;">Error: ${err.message}</h2>`;
            }
        };

        fetchDetails();
    }
});
