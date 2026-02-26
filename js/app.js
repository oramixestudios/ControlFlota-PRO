/**
 * Control Flota PRO - Core Application Logic
 * (ES) Lógica Principal de la Aplicación
 */

/**
 * @section DATABASE ENGINE
 * @description LocalStorage management for data persistence.
 * (ES) Gestión de LocalStorage para la persistencia de datos.
 */
const DB = {
    init: () => {
        // Initialize Units if not exists
        if (!localStorage.getItem('azi_u')) {
            localStorage.setItem('azi_u', JSON.stringify([
                { id: 'u1', name: 'Nissan NP300', plate: 'GTO-123', km: 45000, status: 'available', lastService: 40000, insurance: '2026-12-01', verification: '2026-06-15' },
                { id: 'u2', name: 'Chevrolet Aveo', plate: 'MEX-999', km: 10500, status: 'available', lastService: 10000, insurance: '2026-05-20', verification: '2026-11-30' },
                { id: 'u3', name: 'Ford Ranger', plate: 'LEO-555', km: 82000, status: 'available', lastService: 80000, insurance: '2026-03-10', verification: '2026-08-01' }
            ]));
        }

        // Initialize Users / Drivers
        let users = localStorage.getItem('azi_users');
        if (!users) {
            const mockUsers = [
                { id: 'admin', pass: 'admin1', role: 'admin', name: 'Admin Principal' },
                { id: 'user', pass: 'user', role: 'user', name: 'Juan Perez', age: 30, vision: 'Aprobado', licDate: '2026-05-01' }
            ];
            // Add technical mock drivers for testing
            for (let i = 1; i <= 5; i++) {
                mockUsers.push({
                    id: `cond${i}`,
                    pass: `pass${i}`,
                    role: 'user',
                    name: `Conductor ${i}`,
                    age: 25 + i,
                    vision: 'Aprobado',
                    licDate: '2026-12-31'
                });
            }
            localStorage.setItem('azi_users', JSON.stringify(mockUsers));
        }

        if (!localStorage.getItem('azi_logs')) localStorage.setItem('azi_logs', '[]');
    },

    data: () => ({
        units: JSON.parse(localStorage.getItem('azi_u')),
        users: JSON.parse(localStorage.getItem('azi_users')),
        logs: JSON.parse(localStorage.getItem('azi_logs'))
    }),

    save: (key, val) => localStorage.setItem(key, JSON.stringify(val)),

    addLog: (log) => {
        const logs = DB.data().logs;
        logs.unshift(log);
        DB.save('azi_logs', logs);
    }
};

// Start DB
DB.init();

/**
 * @section SESSION & AUTH
 */
let CURRENT_USER = null;
let CHART_LIC = null, CHART_USAGE = null, CHART_USER_ACT = null;
let mapInstance = null;
let html5QrcodeScanner = null;

function handleLogin(e) {
    if (e) e.preventDefault();
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const users = DB.data().users;
    const found = users.find(x => x.id === u && x.pass === p);

    if (found) {
        CURRENT_USER = found;
        showScreen('hidden');
        if (found.role === 'admin') initAdmin();
        else initUser();
    } else {
        alert('Credenciales incorrectas / Incorrect credentials');
    }
}

function logout() {
    location.reload();
}

function showScreen(id) {
    ['screen-login', 'screen-admin', 'screen-user', 'screen-checkout', 'screen-checkin'].forEach(x => {
        const el = document.getElementById(x);
        if (el) el.classList.add('hidden');
    });

    if (id !== 'hidden') {
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('screen-transition');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Toggle Header Visibility
    const header = document.getElementById('app-header');
    if (id === 'screen-login') header.classList.add('hidden');
    else header.classList.remove('hidden');
}

/**
 * @section ADMIN PANEL LOGIC
 */
function initAdmin() {
    showScreen('screen-admin');
    document.getElementById('header-title').innerText = 'Panel Administrador';
    checkAlerts();
    setAdminTab('dash');
    requestNotifyPermission();
}

function setAdminTab(t) {
    ['dash', 'units', 'users', 'history'].forEach(x => {
        const el = document.getElementById('tab-' + x);
        if (el) el.classList.add('hidden');
    });

    document.querySelectorAll('.nav-tab').forEach(x => x.classList.remove('active'));

    const tabEl = document.getElementById('tab-' + t);
    tabEl.classList.remove('hidden');
    tabEl.classList.add('screen-transition');

    // Tab Highlighting
    const tabs = ['dash', 'units', 'history', 'users'];
    document.querySelectorAll('.nav-tab')[tabs.indexOf(t)].classList.add('active');

    if (t === 'dash') renderCharts();
    if (t === 'units') renderUnits();
    if (t === 'users') renderUsers();
    if (t === 'history') renderHistory();
}

/**
 * @section RENDERING & DATA VISUALIZATION
 */
function renderCharts() {
    // 1. Active Units List
    const activeList = document.getElementById('active-units-list');
    if (activeList) {
        activeList.innerHTML = '';
        const busyUnits = DB.data().units.filter(u => u.status === 'busy');
        if (busyUnits.length === 0) {
            activeList.innerHTML = '<p style="color:#666; font-style:italic;">No hay unidades en ruta actualmente.</p>';
        } else {
            busyUnits.forEach(u => {
                activeList.innerHTML += `
                <div style="background: #e3f2fd; padding: 1rem; border-left: 5px solid var(--primary); margin-bottom: 0.5rem; border-radius: 4px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0; color:var(--primary);">${u.name}</h4>
                            <small>${u.plate}</small>
                        </div>
                        <div style="text-align:right;">
                            <strong>Conductor:</strong><br>
                            <span style="font-size:1.1rem;">${u.assignedTo}</span>
                        </div>
                    </div>
                </div>`;
            });
        }
    }

    // 2. Licenses Chart
    const users = DB.data().users.filter(u => u.role === 'user');
    const valid = users.filter(u => new Date(u.licDate) >= new Date()).length;

    if (CHART_LIC) CHART_LIC.destroy();
    CHART_LIC = new Chart(document.getElementById('c-licenses'), {
        type: 'doughnut',
        data: {
            labels: ['Vigente', 'Vencida'],
            datasets: [{ data: [valid, users.length - valid], backgroundColor: ['#28a745', '#dc3545'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Usage Chart (KM)
    if (CHART_USAGE) CHART_USAGE.destroy();
    CHART_USAGE = new Chart(document.getElementById('c-usage'), {
        type: 'bar',
        data: {
            labels: DB.data().units.map(u => u.name),
            datasets: [{ label: 'Kilómetros', data: DB.data().units.map(u => u.km), backgroundColor: '#1a237e' }]
        },
        options: { responsive: true }
    });

    // 4. User Activity Chart
    const monthFilter = document.getElementById('filter-user-month').value;
    let logs = DB.data().logs.filter(l => l.type === 'out');
    if (monthFilter !== 'all') {
        logs = logs.filter(l => new Date(l.date).getMonth() == monthFilter);
    }
    const userCounts = {};
    logs.forEach(l => { userCounts[l.user] = (userCounts[l.user] || 0) + 1; });
    const sortedUsers = Object.keys(userCounts).sort((a, b) => userCounts[b] - userCounts[a]).slice(0, 10);
    const sortedData = sortedUsers.map(u => userCounts[u]);

    if (CHART_USER_ACT) CHART_USER_ACT.destroy();
    CHART_USER_ACT = new Chart(document.getElementById('c-user-activity'), {
        type: 'bar',
        data: {
            labels: sortedUsers,
            datasets: [{ label: 'Número de Usos', data: sortedData, backgroundColor: '#ffab00' }]
        },
        options: {
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            responsive: true,
            scales: { x: { beginAtZero: true } }
        }
    });

    // Render Map with slight delay for container ready
    setTimeout(renderMap, 300);
    renderMaintenanceAlerts();
}

    });
}

function renderUsers() {
    const list = document.getElementById('users-list');
    if (!list) return;
    list.innerHTML = '';
    DB.data().users.filter(u => u.role === 'user').forEach(u => {
        list.innerHTML += `
        <div style="padding:1rem; border:1px solid #eee; margin-bottom:0.8rem; border-radius:12px; display:flex; justify-content:space-between; align-items:center; background:#fff;">
            <div>
                <strong style="color:var(--primary);">${u.name}</strong><br>
                <small style="color:#888;">${u.id} | ${u.whatsapp || 'Sin Tel.'}</small><br>
                <small style="color:${new Date(u.licDate) < new Date() ? 'var(--danger)' : 'var(--success)'}">
                    Licencia: ${u.licDate}
                </small>
            </div>
            <button class="btn btn-outline" style="color:var(--danger); border:none;" onclick="deleteUser('${u.id}')">
                <i class="fa-solid fa-user-minus"></i>
            </button>
        </div>`;
    });
}

function renderHistory() {
    const list = document.getElementById('logs-list');
    if (!list) return;
    list.innerHTML = '';
    DB.data().logs.slice(0, 50).forEach(l => {
        const isOut = l.type === 'out';
        list.innerHTML += `
        <div style="padding:1rem; border-left:4px solid ${isOut ? '#1e88e5' : '#43a047'}; background:#fff; margin-bottom:0.5rem; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
            <div style="display:flex; justify-content:space-between;">
                <strong>${l.unitName}</strong>
                <small style="color:#888;">${new Date(l.date).toLocaleString()}</small>
            </div>
            <div style="font-size:0.9rem;">
                <span style="color:#666;">Usuario:</span> ${l.user} | 
                <span style="color:#666;">KM:</span> ${l.km}
            </div>
            <div style="font-size:0.8rem; font-style:italic; color:#888; margin-top:5px;">${l.notes || ''}</div>
        </div>`;
    });
}

function renderUserLogs() {
    const list = document.getElementById('user-recent-logs');
    if (!list) return;
    list.innerHTML = '';
    DB.data().logs.filter(l => l.user === CURRENT_USER.name).slice(0, 10).forEach(l => {
        list.innerHTML += `
        <div style="padding:0.8rem; border-bottom:1px solid #eee;">
            <div style="display:flex; justify-content:space-between;">
                <strong>${l.unitName}</strong>
                <small>${new Date(l.date).toLocaleDateString()}</small>
            </div>
            <small style="color:#888;">${l.type === 'out' ? 'Salida' : 'Entrega'} - ${l.km} km</small>
        </div>`;
    });
}

/**
 * @section MAPS & GEOLOCATION
 */
function renderMap() {
    const container = document.getElementById('admin-map');
    if (!container) return;
    if (mapInstance) mapInstance.remove();

    mapInstance = L.map('admin-map').setView([21.1619, -101.6865], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapInstance);

    const logs = DB.data().logs;
    logs.filter(l => l.gps && l.type === 'out').slice(0, 5).forEach(l => {
        const coords = l.gps.split(',').map(Number);
        if (coords.length === 2 && !isNaN(coords[0])) {
            L.marker(coords).addTo(mapInstance)
                .bindPopup(`<b>${l.unitName}</b><br>User: ${l.user}<br>Destino: ${l.dest || 'N/A'}`);
        }
    });
}

async function getGPS() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
}

/**
 * @section UNIT & USER MANAGEMENT
 */
function renderUnits() {
    const list = document.getElementById('units-list');
    list.innerHTML = `<div class="skeleton" style="height:60px; width:100%; border-radius:8px; margin-bottom:0.5rem;"></div>`.repeat(3);
    setTimeout(() => {
        list.innerHTML = DB.data().units.map(u => `
        <div style="padding:1rem; border:1px solid #eee; margin-bottom:0.8rem; border-radius:12px; display:flex; justify-content:space-between; background:#fff; box-shadow:0 2px 5px rgba(0,0,0,0.02);">
            <div><strong>${u.name}</strong><br><small style="color:#888">${u.plate} | ${u.km} km</small></div>
            <div class="status-badge" style="background:${u.status === 'available' ? '#e8f5e9' : '#ffebee'}; color:${u.status === 'available' ? '#2e7d32' : '#c62828'}">
                ${u.status === 'available' ? 'Disponible' : 'En Uso'}
            </div>
        </div>`).join('');
    }, 400);
}

function saveUnit(e) {
    e.preventDefault();
    const units = DB.data().units;
    units.push({
        id: 'u' + (Date.now()),
        name: document.getElementById('unit-name').value,
        plate: document.getElementById('unit-plate').value,
        km: parseInt(document.getElementById('unit-km').value),
        lastService: parseInt(document.getElementById('unit-last-service').value),
        insurance: document.getElementById('unit-ins').value,
        verification: document.getElementById('unit-ver').value,
        status: 'available'
    });
    DB.save('azi_u', units);
    alert('Vehículo Añadido Exitosamente');
    toggleUnitForm();
    renderUnits();
}

function handleAddUser(e) {
    e.preventDefault();
    const id = document.getElementById('new-email').value;
    const users = DB.data().users;
    if (users.find(u => u.id === id)) return alert('El usuario ya existe');

    users.push({
        id: id,
        pass: document.getElementById('new-pass').value,
        role: 'user',
        name: document.getElementById('new-name').value,
        whatsapp: document.getElementById('new-whatsapp').value,
        age: document.getElementById('new-age').value,
        vision: document.getElementById('new-vision').value,
        licDate: document.getElementById('new-lic-date').value
    });
    DB.save('azi_users', users);
    alert('Empleado Registrado');
    renderUsers();
    toggleUserForm();
}

/**
 * @section USER INTERFACE (DRIVER MODE)
 */
function initUser() {
    if (new Date(CURRENT_USER.licDate) < new Date()) {
        document.body.innerHTML = `<div class="container" style="margin-top:20vh; text-align:center; color:red;">
            <i class="fa-solid fa-ban fa-5x"></i><h1>ACCESO DENEGADO</h1><p>Su licencia ha vencido. Contacte a RH.</p>
        </div>`;
        return;
    }
    showScreen('screen-user');
    document.getElementById('user-welcome').innerText = `Bienvenido, ${CURRENT_USER.name}`;
    renderUserLogs();
}

async function handleCheckout(e) {
    e.preventDefault();
    const uid = document.getElementById('checkout-unit').value;
    const dest = document.getElementById('checkout-dest').value;
    const fuel = document.getElementById('checkout-fuel').value;
    if (!uid) return;

    const coords = await getGPS();
    const units = DB.data().units;
    const idx = units.findIndex(u => u.id === uid);

    units[idx].status = 'busy';
    units[idx].assignedTo = CURRENT_USER.name;
    units[idx].assignedData = { startTime: Date.now(), startFuel: fuel, dest: dest };
    DB.save('azi_u', units);

    const photoInput = document.getElementById('checkout-photo');
    DB.addLog({
        type: 'out', unitName: units[idx].name, user: CURRENT_USER.name,
        km: units[idx].km, date: new Date(), notes: `Destino: ${dest} | Gas: ${fuel}`,
        gps: coords, dest: dest, photo: photoInput.dataset.b64 || null
    });

    alert('Salida Confirmada');
    initUser();
}

async function handleCheckin(e) {
    e.preventDefault();
    const uid = document.getElementById('checkin-unit').value;
    const km = parseInt(document.getElementById('checkin-km').value);
    const units = DB.data().units;
    const idx = units.findIndex(u => u.id === uid);

    if (km < units[idx].km) return alert('El kilometraje es menor al inicial.');

    const coords = await getGPS();
    const unit = units[idx];
    let durationMin = 0;
    if (unit.assignedData && unit.assignedData.startTime) {
        durationMin = Math.round((Date.now() - unit.assignedData.startTime) / 60000);
    }

    units[idx].status = 'available';
    units[idx].km = km;
    units[idx].assignedTo = null;
    units[idx].assignedData = null;
    DB.save('azi_u', units);

    DB.addLog({
        type: 'in', unitName: units[idx].name, user: CURRENT_USER.name,
        km: km, date: new Date(), notes: document.getElementById('checkin-notes').value,
        gps: coords, duration: durationMin
    });

    sendNotification('Vehículo Entregado', `${unit.name} recibido.`);
    alert('Entrega Finalizada Correctamente');
    initUser();
}

/**
 * @section VOICE ASSISTANT (WEB SPEECH API)
 */
let recognition;
function toggleVoiceAssistant(ctx = 'user') {
    if (!('webkitSpeechRecognition' in window)) return alert('Navegador no soporta voz.');

    if (!recognition) {
        recognition = new webkitSpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            processVoiceCommand(text, ctx);
        };
        recognition.onstart = () => {
            const status = document.getElementById('voice-status');
            if (status) status.innerText = "Escuchando...";
        };
        recognition.onend = () => {
            const status = document.getElementById('voice-status');
            if (status) status.innerText = "Asistente de Voz";
        };
    }
    recognition.start();
}

function processVoiceCommand(text, ctx) {
    const raw = text.toLowerCase();
    const transcript = document.getElementById(ctx === 'login' ? 'voice-transcript-login' : 'voice-transcript');
    if (transcript) transcript.innerText = `"${text}"`;

    if (ctx === 'login') {
        const found = DB.data().users.find(u => raw.includes(u.name.toLowerCase()));
        if (found) {
            document.getElementById('login-user').value = found.id;
            document.getElementById('login-pass').value = found.pass;
            handleLogin();
        }
    } else {
        // AGENTIC COMMANDS
        if (raw.includes('estatus') || raw.includes('estado')) {
            askAI('status');
            return;
        }
        if (raw.includes('mantenimiento') || raw.includes('servicio')) {
            askAI('maintenance');
            return;
        }
        if (raw.includes('retirar') || raw.includes('salida')) showCheckoutForm();
        if (raw.includes('entregar') || raw.includes('llegue')) showCheckinForm();
        if (raw.includes('inspección') || raw.includes('verificar')) {
            AI.speak("Iniciando revisión de inteligencia...");
            AI.renderPulse();
            if (!document.getElementById('screen-admin').classList.contains('hidden')) setAdminTab('dash');
        }
    }
}

/**
 * @section UTILS & EXPORT
 */
function compressImage(input, previewId) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 800;
            const scale = maxW / img.width;
            canvas.width = maxW;
            canvas.height = img.height * scale;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            input.dataset.b64 = canvas.toDataURL('image/jpeg', 0.6);
            const preview = document.getElementById(previewId);
            if (preview) { preview.src = input.dataset.b64; preview.classList.remove('hidden'); }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function exportHistory() {
    const logs = DB.data().logs;
    let csv = 'Tipo,Unidad,Usuario,KM,Fecha,Notas\n';
    logs.forEach(l => {
        csv += `${l.type},${l.unitName},${l.user},${l.km},${new Date(l.date).toLocaleString()},"${l.notes || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Flota_${Date.now()}.csv`;
    a.click();
}

function runSimulation() {
    if (!confirm('¿Generar 30 días de datos históricos?')) return;
    const logs = [];
    const users = DB.data().users.filter(u => u.role === 'user');
    const units = DB.data().units;
    const today = new Date();

    for (let d = 30; d >= 0; d--) {
        const date = new Date(); date.setDate(today.getDate() - d);
        for (let i = 0; i < 3; i++) {
            const unit = units[i % units.length];
            const user = users[i % users.length];
            logs.push({ type: 'out', unitName: unit.name, user: user.name, km: unit.km, date: new Date(date.setHours(8 + i)) });
            unit.km += 50;
            logs.push({ type: 'in', unitName: unit.name, user: user.name, km: unit.km, date: new Date(date.setHours(12 + i)) });
        }
    }
    DB.save('azi_logs', logs);
    DB.save('azi_u', units);
    location.reload();
}

/**
 * @section SERVICE WORKER / PWA HELPERS
 */
function sendNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
    }
}
function requestNotifyPermission() {
    if ("Notification" in window) Notification.requestPermission();
}

/**
 * UI Toggle Helpers & Form Population
 */
function toggleUnitForm() { document.getElementById('add-unit-form').classList.toggle('hidden'); }
function toggleUserForm() { document.getElementById('add-user-form').classList.toggle('hidden'); }

function showCheckoutForm() {
    showScreen('screen-checkout');
    const sel = document.getElementById('checkout-unit');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccionar --</option>';
    DB.data().units.filter(u => u.status === 'available').forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id; opt.text = `${u.name} (${u.plate})`; opt.dataset.km = u.km;
        sel.add(opt);
    });
}

function updateCheckoutKm() {
    const sel = document.getElementById('checkout-unit');
    const kmInput = document.getElementById('checkout-km');
    if (sel && sel.selectedIndex > 0) kmInput.value = sel.options[sel.selectedIndex].dataset.km;
    else if (kmInput) kmInput.value = '';
}

function showCheckinForm() {
    showScreen('screen-checkin');
    const sel = document.getElementById('checkin-unit');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Seleccionar --</option>';
    DB.data().units.filter(u => u.status === 'busy').forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id; opt.text = `${u.name} (${u.plate})`; opt.dataset.km = u.km;
        sel.add(opt);
    });
}

function updateCheckinMin() {
    const id = document.getElementById('checkin-unit').value;
    const u = DB.data().units.find(x => x.id === id);
    if (u) {
        const kmInput = document.getElementById('checkin-km');
        const msg = document.getElementById('checkin-msg');
        kmInput.min = u.km;
        kmInput.value = u.km;
        msg.innerText = `Mínimo: ${u.km} km`;

        if (u.assignedData && u.assignedData.startTime) {
            const box = document.getElementById('checkin-duration-box');
            const txt = document.getElementById('checkin-duration-text');
            box.classList.remove('hidden');
            box.style.display = 'flex';
            const diff = Date.now() - u.assignedData.startTime;
            const minutes = Math.round(diff / 60000);
            txt.innerText = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
        }
    }
}

function deleteUser(id) {
    if (!confirm('¿Eliminar conductor?')) return;
    const users = DB.data().users.filter(u => u.id !== id);
    DB.save('azi_users', users);
    renderUsers();
}

/**
 * QR SCANNER LOGIC
 */
function startQRScanner() {
    const container = document.getElementById('qr-reader') || document.getElementById('qr-login-reader');
    if (!container) return;
    container.classList.remove('hidden');

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode(container.id);
    }

    html5QrcodeScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (decodedText) => {
        html5QrcodeScanner.stop().then(() => container.classList.add('hidden'));
        const unit = DB.data().units.find(u => u.id === decodedText || u.plate === decodedText);
        if (!unit) return alert('QR no reconocido');

        if (unit.status === 'available') {
            showCheckoutForm();
            document.getElementById('checkout-unit').value = unit.id;
            updateCheckoutKm();
        } else {
            showCheckinForm();
            document.getElementById('checkin-unit').value = unit.id;
            updateCheckinMin();
        }
    }).catch(err => console.error(err));
}

function startLoginQR() {
    const container = document.getElementById('qr-login-reader');
    if (!container) return;
    container.classList.remove('hidden');

    const scanner = new Html5Qrcode(container.id);
    scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 200 }, (text) => {
        scanner.stop().then(() => container.classList.add('hidden'));
        if (text.startsWith("LOGIN:")) {
            const [, u, p] = text.split(':');
            document.getElementById('login-user').value = u;
            document.getElementById('login-pass').value = p;
            handleLogin();
        }
    });
}

/**
 * BIOMETRIC AUTH (WebAuthn)
 */
const strToBuf = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const bufToStr = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

async function registerBiometric() {
    if (!window.PublicKeyCredential) return alert('Biometría no soportada en este entorno.');
    if (!CURRENT_USER) return;

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKey = {
            challenge: challenge,
            rp: { name: "Control Flota PRO" },
            user: {
                id: Uint8Array.from(CURRENT_USER.id, c => c.charCodeAt(0)),
                name: CURRENT_USER.id,
                displayName: CURRENT_USER.name
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
            authenticatorSelection: { authenticatorAttachment: "platform" },
            timeout: 60000
        };

        const credential = await navigator.credentials.create({ publicKey });
        const credId = bufToStr(credential.rawId);

        const users = DB.data().users;
        const idx = users.findIndex(u => u.id === CURRENT_USER.id);
        if (idx !== -1) {
            users[idx].bioId = credId;
            DB.save('azi_users', users);
            alert('✅ Biometría Vinculada.');
        }
    } catch (e) {
        console.error(e);
        alert('Error: ' + e.message);
    }
}

async function handleBioLogin() {
    const bioUsers = DB.data().users.filter(u => u.bioId);
    if (bioUsers.length === 0) return alert('Sin perfiles biométricos registrados.');

    try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const publicKey = {
            challenge: challenge,
            allowCredentials: bioUsers.map(u => ({ id: strToBuf(u.bioId), type: 'public-key' })),
            timeout: 60000
        };

        const assertion = await navigator.credentials.get({ publicKey });
        const credId = bufToStr(assertion.rawId);
        const found = bioUsers.find(u => u.bioId === credId);

        if (found) {
            CURRENT_USER = found;
            showScreen('hidden');
            if (found.role === 'admin') initAdmin();
            else initUser();
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * @section AGENTIC AI ENGINE
 */
const AI = {
    getInsights: () => {
        const units = DB.data().units;
        const logs = DB.data().logs;
        const insights = [];

        // 1. Overuse Detection
        const outLogs = logs.filter(l => l.type === 'out');
        units.forEach(u => {
            const usage = outLogs.filter(l => l.unitName === u.name).length;
            if (usage > 10) {
                insights.push({
                    type: 'warning',
                    text: `La unidad ${u.name} tiene una alta demanda (10+ servicios). Sugerimos rotación.`
                });
            }

            // 2. Predictive Maintenance
            const diffKm = u.km - (u.lastService || 0);
            if (diffKm > 8000) {
                insights.push({
                    type: 'critical',
                    text: `Alerta Predictiva: ${u.name} requiere servicio técnico en los próximos 500km.`
                });
            }
        });

        // 3. Document Expiry Agent
        const expiringSoon = units.filter(u => {
            const ins = new Date(u.insurance);
            const diff = (ins - new Date()) / (1000 * 60 * 60 * 24);
            return diff > 0 && diff < 15;
        });

        if (expiringSoon.length > 0) {
            insights.push({
                type: 'info',
                text: `${expiringSoon.length} unidades tienen seguros por vencer en menos de 15 días.`
            });
        }

        return insights;
    },

    renderPulse: () => {
        const container = document.getElementById('ai-pulse-container');
        const feed = document.getElementById('ai-insights-feed');
        if (!container || !feed) return;

        const insights = AI.getInsights();
        if (insights.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        feed.innerHTML = insights.map(i => `
            <div class="insight-item insight-${i.type}">
                <i class="fa-solid fa-${i.type === 'critical' ? 'triangle-exclamation' : (i.type === 'warning' ? 'circle-exclamation' : 'circle-info')}"></i>
                ${i.text}
            </div>
        `).join('');
    },

    speak: (text) => {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a more natural Spanish voice (Google Spanish is usually available)
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => v.lang.includes('es-MX') && v.name.includes('Google')) ||
            voices.find(v => v.lang.includes('es')) ||
            voices[0];

        if (bestVoice) utterance.voice = bestVoice;

        utterance.lang = 'es-MX';
        utterance.rate = 1.0; // Slightly faster for natural flow
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
};

/**
 * @section AI HUB UI LOGIC
 */
function toggleAgenticAI() {
    const panel = document.getElementById('ai-hub-panel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        AI.renderPulse();
    }
}

function askAI(topic) {
    const responseEl = document.getElementById('ai-hub-response');
    responseEl.classList.remove('hidden');
    let msg = "";

    if (topic === 'status') {
        const busy = DB.data().units.filter(u => u.status === 'busy').length;
        msg = `Actualmente tienes ${busy} unidades en ruta y ${DB.data().units.length - busy} disponibles. Todo parece bajo control.`;
    } else if (topic === 'maintenance') {
        const critical = DB.data().units.filter(u => (u.km - u.lastService) > 9000).length;
        msg = critical > 0 ? `Atención: Tienes ${critical} unidades en estado crítico de mantenimiento. ¿Quieres que genere un reporte?` : "Toda la flota está al día con sus servicios.";
    }

    responseEl.innerText = msg;
    AI.speak(msg);
}

// Intercept existing initAdmin to include AI Pulse
const oldInitAdmin = initAdmin;
initAdmin = function () {
    oldInitAdmin();
    AI.renderPulse();
};

// Export to window
window.toggleAgenticAI = toggleAgenticAI;
window.askAI = askAI;
window.AI = AI;
window.handleLogin = handleLogin;
window.logout = logout;
window.setAdminTab = setAdminTab;
window.toggleUnitForm = toggleUnitForm;
window.saveUnit = saveUnit;
window.toggleUserForm = toggleUserForm;
window.handleAddUser = handleAddUser;
window.handleCheckout = handleCheckout;
window.handleCheckin = handleCheckin;
window.showCheckoutForm = showCheckoutForm;
window.showCheckinForm = showCheckinForm;
window.updateCheckoutKm = updateCheckoutKm;
window.updateCheckinMin = updateCheckinMin;
window.toggleVoiceAssistant = toggleVoiceAssistant;
window.compressImage = compressImage;
window.exportHistory = exportHistory;
window.runSimulation = runSimulation;
window.showScreen = showScreen;
window.deleteUser = deleteUser;
window.startQRScanner = startQRScanner;
window.startLoginQR = startLoginQR;
window.registerBiometric = registerBiometric;
window.handleBioLogin = handleBioLogin;
window.renderResults = renderCharts;
window.renderCharts = renderCharts;

console.log("Control Flota PRO Loaded - GitHub Ready");


