// filename: student_login.js
document.addEventListener('DOMContentLoaded', function() {
    resetButton();
    clearSessionFlags();
    initFormHandling();
    initPasswordToggle();
    initToastSystem();
    initAnimations();
    loadRememberedEmail();
    checkDjangoMessages();
});

function clearSessionFlags() {
    sessionStorage.removeItem('login_submitted');
    sessionStorage.removeItem('login_email');
}

function resetButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');
    loginBtn.innerHTML = `
        <span class="btn-text">Sign In as Student</span>
        <svg class="btn-icon" viewBox="0 0 24 24">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
        <span class="btn-loader">
            <div class="spinner"></div>
        </span>
    `;
}

function checkDjangoMessages() {
    const errorElement = document.getElementById('djangoError');
    if (errorElement && errorElement.value) {
        const errorMessage = errorElement.value.trim();
        if (errorMessage) {
            showToast(errorMessage, 'error', 5000);
            const passwordField = document.getElementById("password");
            if (passwordField) passwordField.value = "";
            const storedEmail = sessionStorage.getItem("login_email");
            if (storedEmail) {
                const emailField = document.getElementById("email");
                if (emailField) emailField.value = storedEmail;
            }
        }
    }
    const successElement = document.getElementById('successMessage');
    if (successElement && successElement.value === 'true') {
        showToast('Login successful! Redirecting...', 'success', 2000);
        setTimeout(() => {
            window.location.href = '/student-dashboard/';
        }, 2000);
    }
}

function initFormHandling() {
    const loginForm = document.getElementById('studentLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    if (!loginForm || !loginBtn) return;
    let isSubmitting = false;
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isSubmitting) return;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        clearValidationError('email_error');
        clearValidationError('password_error');
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            shakeElement(loginForm);
            return;
        }
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            showValidationError('email_error', 'Invalid email format');
            shakeElement(loginForm);
            return;
        }
        isSubmitting = true;
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        sessionStorage.setItem('login_email', email);
        sessionStorage.setItem('login_submitted', 'true');
        if (rememberMe) {
            localStorage.setItem('remembered_email', email);
        } else {
            localStorage.removeItem('remembered_email');
        }
        loginForm.submit();
    });
}

function initPasswordToggle() {
    const toggleBtn = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    if (!toggleBtn || !passwordInput) return;
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('visible', type === 'text');
    });
}

function initToastSystem() {
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>';
            break;
        case 'error':
            icon = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>';
            break;
        default:
            icon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    }
    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showValidationError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
    }
}

function clearValidationError(fieldId) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
        errorElement.classList.remove('active');
        errorElement.textContent = '';
    }
}

function shakeElement(element) {
    if (element) {
        element.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
        const emailInput = document.getElementById('email');
        const rememberCheckbox = document.getElementById('rememberMe');
        if (emailInput) emailInput.value = rememberedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

function initAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        }
        .toast {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 400px;
            padding: 16px 20px;
            margin-bottom: 10px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
            border-left: 4px solid;
        }
        .toast svg {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
        }
        .toast.success {
            border-left-color: #10b981;
        }
        .toast.success svg {
            fill: #10b981;
        }
        .toast.error {
            border-left-color: #ef4444;
        }
        .toast.error svg {
            fill: #ef4444;
        }
        .toast.info {
            border-left-color: #3b82f6;
        }
        .toast.info svg {
            fill: #3b82f6;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        .btn-loader {
            display: none;
        }
        .btn.loading .btn-text,
        .btn.loading .btn-icon {
            display: none;
        }
        .btn.loading .btn-loader {
            display: inline-block;
        }
        .spinner {
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .validation-error {
            display: none;
            color: #ef4444;
            font-size: 12px;
            margin-top: 4px;
        }
        .validation-error.active {
            display: block;
        }
        .toggle-password.visible svg path:first-child {
            d: path("M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z");
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        resetButton();
    }
});

window.addEventListener('beforeunload', function() {
    if (!document.getElementById('studentLoginForm')?.classList.contains('submitting')) {
        sessionStorage.removeItem('login_submitted');
    }
});