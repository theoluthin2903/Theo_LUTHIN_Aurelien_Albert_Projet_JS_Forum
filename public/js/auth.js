document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation entre formulaires ---
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    
    document.getElementById('show-register').onclick = () => {
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
    };

    document.getElementById('show-login').onclick = () => {
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    };

    // --- FT-1 : INSCRIPTION (Simulation) ---
    document.getElementById('register-form').onsubmit = (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // Validation (FT-1)
        const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
        if (!regex.test(password)) {
            alert("Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 spécial.");
            return;
        }

        // On simule une base de données avec localStorage
        const users = JSON.parse(localStorage.getItem('users') || "[]");
        
        // Vérifier si l'utilisateur existe déjà
        if (users.find(u => u.username === username || u.email === email)) {
            alert("Pseudo ou Email déjà utilisé !");
            return;
        }

        // Enregistrement
        users.push({ username, email, password, role: 'user' });
        localStorage.setItem('users', JSON.stringify(users));

        alert("Inscription réussie ! Connectez-vous maintenant.");
        document.getElementById('show-login').click();
    };

    // --- FT-2 : CONNEXION (Simulation) ---
    document.getElementById('login-form').onsubmit = (e) => {
        e.preventDefault();

        const id = document.getElementById('login-id').value;
        const pass = document.getElementById('login-pass').value;

        const users = JSON.parse(localStorage.getItem('users') || "[]");
        
        // On cherche l'utilisateur (par pseudo ou email)
        const user = users.find(u => (u.username === id || u.email === id) && u.password === pass);

        if (user) {
            // On sauvegarde qui est connecté pour le forum.html
            localStorage.setItem('currentUser', JSON.stringify(user));
            alert("Connexion réussie ! Bienvenue " + user.username);
            window.location.href = 'forum.html'; // Redirection
        } else {
            alert("Identifiant ou mot de passe incorrect.");
        }
    };
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    // 1. Vérifier si un thème est déjà enregistré
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            themeToggle.textContent = '☀️'; // Icône soleil pour repasser en clair
        }
    }

    // 2. Gérer le clic sur le bouton
    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });
});