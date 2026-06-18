const SERVER_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
        if (themeToggle) themeToggle.textContent = (t === 'dark') ? '☀️' : '🌙';
    };
    applyTheme(localStorage.getItem('theme') || 'light');
    if (themeToggle) themeToggle.onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

    // Visibilité MDP
    const setupPass = (id, btn) => {
        const i = document.getElementById(id), b = document.getElementById(btn);
        if(i && b) b.onclick = () => { const h = i.type === 'password'; i.type = h ? 'text' : 'password'; b.textContent = h ? '🙈' : '👁️'; };
    };
    setupPass('login-pass', 'toggle-password-visibility');
    setupPass('reg-password', 'toggle-reg-password');

    // Navigation
    document.getElementById('show-register').onclick = () => { document.getElementById('login-box').classList.add('hidden'); document.getElementById('register-box').classList.remove('hidden'); };
    document.getElementById('show-login').onclick = () => { document.getElementById('register-box').classList.add('hidden'); document.getElementById('login-box').classList.remove('hidden'); };

    // Login
    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: document.getElementById('login-id').value, password: document.getElementById('login-pass').value }),
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);
            window.location.href = '/forum';
        } else alert(data.message);
    };

    // Register
    document.getElementById('register-form').onsubmit = async (e) => {
        e.preventDefault();
        const res = await fetch(`${SERVER_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: document.getElementById('reg-username').value, 
                email: document.getElementById('reg-email').value, 
                password: document.getElementById('reg-password').value 
            })
        });
        const data = await res.json();
        if (data.success) { alert("Succès ! Connectez-vous."); document.getElementById('show-login').click(); }
        else alert(data.message);
    };
});s