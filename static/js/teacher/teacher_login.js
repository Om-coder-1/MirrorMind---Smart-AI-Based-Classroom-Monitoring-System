// filename: teacher_login.js
document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;

    initParticles();
    initForm(csrfToken);
    initPasswordToggle();
    initModals();
    loadRememberedEmail();
    initCardHover();
});

function initParticles() {
    const layer = document.querySelector('.particle-layer');
    if (!layer) return;

    layer.innerHTML = '';

    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.width = (2 + Math.random() * 3) + 'px';
        p.style.height = p.style.width;
        p.style.animationDelay = Math.random() * 20 + 's';
        p.style.animationDuration = (15 + Math.random() * 15) + 's';
        p.style.background = ['linear-gradient(45deg, #7C3AED, #A78BFA)',
            'linear-gradient(45deg, #A78BFA, #7C3AED)',
            'linear-gradient(45deg, #F59E0B, #A78BFA)'][Math.floor(Math.random() * 3)];
        layer.appendChild(p);
    }
}

function initCardHover() {
    const card = document.querySelector('.login-card');
    const glow = document.querySelector('.card-hover-glow');
    if (!card || !glow) return;

    card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        glow.style.setProperty('--mouse-x', ((e.clientX - rect.left) / rect.width) * 100 + '%');
        glow.style.setProperty('--mouse-y', ((e.clientY - rect.top) / rect.height) * 100 + '%');
        glow.style.opacity = '1';
    });

    card.addEventListener('mouseleave', function () {
        glow.style.opacity = '0';
    });
}

function initForm(csrfToken) {
    const form = document.getElementById('teacherLoginForm');
    const btn = document.getElementById('loginBtn');
    const overlay = document.getElementById('loadingOverlay');
    if (!form || !btn) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const remember = document.getElementById('rememberMe').checked;

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            shake(form);
            return;
        }

        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            showError('email_error', 'Please enter a valid email');
            shake(form);
            return;
        } else {
            hideError('email_error');
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            showError('password_error', 'Password must be at least 6 characters');
            shake(form);
            return;
        } else {
            hideError('password_error');
        }

        btn.classList.add('loading');
        btn.disabled = true;
        if (overlay) overlay.classList.remove('hidden');

        try {
            const data = new FormData();
            data.append('email', email);
            data.append('password', password);
            if (remember) data.append('remember', 'true');

            const res = await fetch('/teacher-login/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: data
            });

            const json = await res.json();

            btn.classList.remove('loading');
            btn.disabled = false;
            if (overlay) overlay.classList.add('hidden');

            if (res.ok && json.success === true) {
                if (remember) {
                    localStorage.setItem('teacher_remembered', 'true');
                    localStorage.setItem('teacher_email', email);
                } else {
                    localStorage.removeItem('teacher_remembered');
                    localStorage.removeItem('teacher_email');
                }
                showSuccess();
            } else {
                handleError(json.error || json.message || 'Invalid email or password');
            }
        } catch (err) {
            btn.classList.remove('loading');
            btn.disabled = false;
            if (overlay) overlay.classList.add('hidden');
            handleError('Network error. Please check your connection.');
        }
    });

    const emailInput = document.getElementById('email');
    const passInput = document.getElementById('password');

    emailInput?.addEventListener('blur', function () {
        if (this.value && !validateEmail(this.value)) {
            showError('email_error', 'Please enter a valid email');
        } else {
            hideError('email_error');
        }
    });

    emailInput?.addEventListener('input', function () {
        hideError('email_error');
    });

    passInput?.addEventListener('blur', function () {
        if (this.value && this.value.length < 6) {
            showError('password_error', 'Password must be at least 6 characters');
        } else {
            hideError('password_error');
        }
    });

    passInput?.addEventListener('input', function () {
        hideError('password_error');
    });
}

function initPasswordToggle() {
    const btn = document.querySelector('.toggle-password');
    const input = document.getElementById('password');
    if (!btn || !input) return;

    btn.addEventListener('click', function () {
        input.type = input.type === 'password' ? 'text' : 'password';
    });
}

function initModals() {
    document.getElementById('closeError')?.addEventListener('click', function () {
        hideModal('errorModal');
    });

    document.getElementById('tryAgainBtn')?.addEventListener('click', function () {
        hideModal('errorModal');
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) hideModal(this.id);
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });
}

function handleError(msg) {
    showToast(msg, 'error');
    shake(document.getElementById('teacherLoginForm'));

    const modal = document.getElementById('errorModal');
    const msgEl = document.getElementById('errorMessage');
    if (modal && msgEl) {
        msgEl.textContent = msg;
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    }
}

function showSuccess() {
    showToast('Login successful! Redirecting to dashboard...', 'success');

    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    setTimeout(() => {
        window.location.href = '/teacher-dashboard/';
    }, 2500);
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') {
        icon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    } else if (type === 'error') {
        icon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
    } else {
        icon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v6z"/></svg>';
    }

    toast.innerHTML = icon + '<span>' + msg + '</span>';
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.4s ease forwards';
            setTimeout(() => toast.remove(), 400);
        }
    }, 4500);

    toast.addEventListener('mouseenter', () => {
        toast.style.animationPlayState = 'paused';
    });

    toast.addEventListener('mouseleave', () => {
        toast.style.animationPlayState = 'running';
    });
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.classList.add('active');
    }
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function shake(el) {
    if (!el) return;
    el.style.animation = 'shake 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
        el.style.animation = '';
    }, 500);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
}

function loadRememberedEmail() {
    if (localStorage.getItem('teacher_remembered') === 'true') {
        const email = localStorage.getItem('teacher_email');
        const input = document.getElementById('email');
        const check = document.getElementById('rememberMe');
        if (email && input) input.value = email;
        if (check) check.checked = true;
    }
}

const style = document.createElement('style');
style.textContent = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);