const SERVER_URL = "http://localhost:3000";

// --- GESTION DU THÈME PARTAGÉE ---
function initTheme() {
    const btn = document.getElementById('theme-toggle');
    const apply = (t) => {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
        if (btn) btn.textContent = (t === 'dark') ? '☀️' : '🌙';
    };
    // Charge le thème sauvegardé ou 'light' par défaut
    apply(localStorage.getItem('theme') || 'light');
    if (btn) {
        btn.onclick = () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            apply(next);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    if(showRegisterLink) showRegisterLink.onclick = (e) => { e.preventDefault(); loginBox.classList.add('hidden'); registerBox.classList.remove('hidden'); };
    if(showLoginLink) showLoginLink.onclick = (e) => { e.preventDefault(); registerBox.classList.add('hidden'); loginBox.classList.remove('hidden'); };

    // Toggle Visibilité MDP
    function setupPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(buttonId);
        if (input && btn) {
            btn.onclick = () => {
                const isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                btn.textContent = isHidden ? '🙈' : '👁️';
            };
        }
    }
    setupPasswordToggle('login-pass', 'toggle-password-visibility');
    setupPasswordToggle('reg-password', 'toggle-reg-password');

    // Connexion
    document.getElementById('login-form').onsubmit = async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-id').value;
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
                // On sauvegarde les infos user SANS écraser le thème
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('userRole', data.user.role);
                window.location.href = '/forum';
            } else { alert(data.message); }
        } catch (err) { alert("Serveur injoignable"); }
    };

    // Inscription
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
        if (data.success) { alert("Succès ! Connectez-vous."); showLoginLink.click(); }
        else alert(data.message);
    };
});