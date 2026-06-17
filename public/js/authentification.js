const SERVER_URL = "http://localhost:3000";

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. THÈME ---
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
        if (themeToggle) themeToggle.textContent = (t === 'dark') ? '☀️' : '🌙';
    };
    applyTheme(localStorage.getItem('theme') || 'light');
    if (themeToggle) themeToggle.onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

    // --- 2. OEIL MOT DE PASSE ---
    function setupPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(buttonId);
        if (input && btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                btn.textContent = isHidden ? '🙈' : '👁️';
            };
        }
    }
    setupPasswordToggle('login-pass', 'toggle-password-visibility');
    setupPasswordToggle('reg-password', 'toggle-reg-password');

    // --- 3. NAVIGATION ---
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    if(showRegisterLink) showRegisterLink.onclick = (e) => { e.preventDefault(); loginBox.classList.add('hidden'); registerBox.classList.remove('hidden'); };
    if(showLoginLink) showLoginLink.onclick = (e) => { e.preventDefault(); registerBox.classList.add('hidden'); loginBox.classList.remove('hidden'); };

    // --- 4. CONNEXION ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('login-id').value.trim();
            const password = document.getElementById('login-pass').value;

            try {
                const res = await fetch(`${SERVER_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password }),
                    credentials: 'include'
                });

                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('username', data.user.username);
                    window.location.href = `${SERVER_URL}/forum`;
                } else {
                    alert("Erreur : " + data.message);
                }
            } catch (err) {
                alert("Erreur 500 : Le serveur a planté. Vérifie que MySQL est lancé et que la base 'forum_db' existe.");
            }
        };
    }

    // --- 5. INSCRIPTION ---
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;

            try {
                const res = await fetch(`${SERVER_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                    credentials: 'include'
                });
                const data = await res.json();
                if (data.success) {
                    alert("Inscription réussie !");
                    showLoginLink.click();
                } else {
                    alert(data.message);
                }
            } catch (err) { alert("Erreur réseau ou serveur."); }
        };
    }
});