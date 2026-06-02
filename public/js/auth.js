document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Gestion de l'affichage (Toggle entre Login et Register) ---
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.add('hidden');
        registerBox.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerBox.classList.add('hidden');
        loginBox.classList.remove('hidden');
    });

    // --- 2. FT-1 : INSCRIPTION ---
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // Validation du mot de passe (FT-1 : 8 car., 1 maj, 1 car. spécial)
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        
        if (!passwordRegex.test(password)) {
            alert("Erreur : Le mot de passe doit faire au moins 8 caractères, contenir une majuscule et un caractère spécial.");
            return;
        }

        const userData = {
            username: username,
            email: email,
            password: password
        };

        try {
            // Remplacer '/api/register' par l'URL du serveur (ex: 'http://localhost:8080/register')
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                alert("Inscription réussie ! Connectez-vous.");
                showLoginLink.click(); // Bascule sur la connexion
            } else {
                const error = await response.json();
                alert("Erreur : " + error.message);
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
            alert("Le serveur ne répond pas.");
        }
    });

    // --- 3. FT-2 : CONNEXION ---
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const identifier = document.getElementById('login-id').value;
        const password = document.getElementById('login-pass').value;

        const loginData = {
            identifier: identifier, // Peut être pseudo ou email
            password: password
        };

        try {
            // Remplacer '/api/login' par l' URL du serveur
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const data = await response.json();
                
                // On stocke le token ou l'info utilisateur (très important pour le forum)
                localStorage.setItem('user', JSON.stringify(data.user)); 
                
                // Redirection vers le forum
                window.location.href = 'forum.html';
            } else {
                alert("Identifiants incorrects.");
            }
        } catch (err) {
            console.error("Erreur réseau :", err);
            alert("Erreur de connexion au serveur.");
        }
    }); 
});