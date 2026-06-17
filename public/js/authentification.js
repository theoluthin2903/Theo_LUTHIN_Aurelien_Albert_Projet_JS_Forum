document.addEventListener('DOMContentLoaded', () => {
    // --- 1. NAVIGATION ENTRE FORMULAIRES ---
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    showRegisterLink.onclick = (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
    };

    showLoginLink.onclick = (e) => {
        e.preventDefault();
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    };

    // --- 2. GESTION DE LA VISIBILITÉ DES MOTS DE PASSE ---
    // Fonction générique pour basculer l'affichage
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

    // Activation pour le Login et l'Inscription
    setupPasswordToggle('login-pass', 'toggle-password-visibility');
    setupPasswordToggle('reg-password', 'toggle-reg-password'); // Assurez-vous que cet ID existe dans votre HTML


    // --- 3. FT-1 : INSCRIPTION ---
    const registerForm = document.getElementById('register-form');
    registerForm.onsubmit = (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;

        // Validation du mot de passe (8+ caractères, 1 majuscule, 1 spécial)
        const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
        if (!regex.test(password)) {
            alert("Erreur : Le mot de passe doit contenir au moins 8 caractères, une majuscule et un caractère spécial.");
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || "[]");
        
        // Vérifier les doublons
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email === email)) {
            alert("Erreur : Ce pseudo ou cet email est déjà utilisé.");
            return;
        }

        // Sauvegarde de l'utilisateur
        users.push({ username, email, password, role: 'user' });
        localStorage.setItem('users', JSON.stringify(users));

        alert("Compte créé avec succès ! Veuillez vous connecter.");
        showLoginLink.click(); // Retour au formulaire de connexion
        registerForm.reset();
    };


    // --- 4. FT-2 : CONNEXION ---
    const loginForm = document.getElementById('login-form');
    loginForm.onsubmit = (e) => {
        e.preventDefault();

        const id = document.getElementById('login-id').value.trim();
        const pass = document.getElementById('login-pass').value;

        const users = JSON.parse(localStorage.getItem('users') || "[]");
        
        // Recherche par pseudo OU email
        const user = users.find(u => (u.username === id || u.email === id) && u.password === pass);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            alert("Connexion réussie ! Bienvenue " + user.username);
            window.location.href = 'forum.html'; 
        } else {
            alert("Identifiants incorrects.");
        }
    };


    // --- 5. GESTION DU THÈME ---
    const themeToggle = document.getElementById('theme-toggle');
    
    // Initialisation de l'icône au chargement
    const updateThemeIcon = (theme) => {
        themeToggle.textContent = (theme === 'dark') ? '☀️' : '🌙';
    };
    updateThemeIcon(localStorage.getItem('theme') || 'light');

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = (theme === 'dark') ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
});