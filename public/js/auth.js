// Switch entre Login et Register
document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('register-box').classList.remove('hidden');
});

document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('register-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
});

// FT-1: Validation Inscription
document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('reg-password').value;
    
    // Regex : 8 carac min, 1 maj, 1 spécial
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if(!regex.test(password)) {
        alert("Le mot de passe ne respecte pas les critères (8 car., 1 maj., 1 spéc.)");
        return;
    }
    
    console.log("Inscription validée pour : " + document.getElementById('reg-username').value);
    
    
});