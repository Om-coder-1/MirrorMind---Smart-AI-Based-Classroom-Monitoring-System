// filename: teacher_reset_password.js
document.addEventListener('DOMContentLoaded', function() {
    const emailStep = document.getElementById('emailStep');
    const otpStep = document.getElementById('otpStep');
    const passwordStep = document.getElementById('passwordStep');
    const successStep = document.getElementById('successStep');
    
    const otpDigits = document.querySelectorAll('.otp-digit');
    const otpInput = document.getElementById('otpInput');
    const otpEmailDisplay = document.getElementById('otpEmailDisplay');
    
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMatchIndicator = document.getElementById('passwordMatch');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    const strengthRules = document.querySelectorAll('.strength-rules li');
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    let currentStep = 1;
    let otpTimer = null;
    let otpCountdown = 60;
    let autoRedirectTimer = null;
    let autoRedirectCountdown = 5;
    let currentEmail = '';
    
    addParticles();
    
    function showStep(step) {
        currentStep = step;
        
        emailStep.classList.remove('active');
        otpStep.classList.remove('active');
        passwordStep.classList.remove('active');
        successStep.classList.remove('active');
        
        emailStep.style.display = 'none';
        otpStep.style.display = 'none';
        passwordStep.style.display = 'none';
        successStep.style.display = 'none';
        
        if (step === 1) {
            emailStep.style.display = 'block';
            emailStep.classList.add('active');
        } else if (step === 2) {
            otpStep.style.display = 'block';
            otpStep.classList.add('active');
            startOtpTimer();
        } else if (step === 3) {
            passwordStep.style.display = 'block';
            passwordStep.classList.add('active');
        } else if (step === 4) {
            successStep.style.display = 'block';
            successStep.classList.add('active');
            startAutoRedirect();
        }
        
        const activeStep = document.querySelector('.form-step.active');
        if (activeStep) {
            activeStep.style.animation = 'none';
            setTimeout(() => {
                activeStep.style.animation = 'slideInRight 0.5s ease';
            }, 10);
        }
    }
    
    function startOtpTimer() {
        otpCountdown = 60;
        resendOtpBtn.disabled = true;
        
        if (otpTimer) clearInterval(otpTimer);
        
        otpTimer = setInterval(() => {
            otpCountdown--;
            document.getElementById('countdown').textContent = otpCountdown;
            
            if (otpCountdown <= 0) {
                clearInterval(otpTimer);
                resendOtpBtn.disabled = false;
            }
        }, 1000);
    }
    
    function startAutoRedirect() {
        autoRedirectCountdown = 5;
        
        if (autoRedirectTimer) clearInterval(autoRedirectTimer);
        
        autoRedirectTimer = setInterval(() => {
            autoRedirectCountdown--;
            document.getElementById('redirectTimer').textContent = autoRedirectCountdown;
            
            if (autoRedirectCountdown <= 0) {
                clearInterval(autoRedirectTimer);
                window.location.href = '/teacher-login/';
            }
        }, 1000);
    }
    
    document.getElementById('backToEmail')?.addEventListener('click', () => showStep(1));
    
    emailStep.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailStep.querySelector('input[name="email"]').value.trim();
        if (!email) {
            showToast('Please enter your email address', 'error');
            shakeElement(this);
            return;
        }
        
        if (!validateEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            showValidationError('email_error', 'Please enter a valid email');
            shakeElement(this);
            return;
        } else {
            hideValidationError('email_error');
        }
        
        currentEmail = email;
        otpEmailDisplay.textContent = maskEmail(email);
        
        await sendOtp(email);
    });
    
    async function sendOtp(email) {
        showLoading('Sending OTP...');
        
        const csrfToken = getCSRFToken();
        
        try {
            const response = await fetch('/teacher-reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'send_otp',
                    email: email
                })
            });
            
            const data = await response.json();
            
            hideLoading();
            
            if (data.success) {
                showStep(2);
                showToast('OTP sent successfully! Check your email.', 'success');
                
                setTimeout(() => {
                    if (otpDigits[0]) otpDigits[0].focus();
                }, 500);
            } else {
                showToast(data.error || 'Failed to send OTP', 'error');
            }
            
        } catch (error) {
            hideLoading();
            showToast('Network error. Please try again.', 'error');
        }
    }
    
    resendOtpBtn.addEventListener('click', async function() {
        if (resendOtpBtn.disabled) return;
        
        if (!currentEmail) {
            showToast('Email not found', 'error');
            return;
        }
        
        resendOtpBtn.disabled = true;
        resendOtpBtn.innerHTML = '<span class="spinner"></span> Sending...';
        
        await sendOtp(currentEmail);
        
        startOtpTimer();
        resendOtpBtn.innerHTML = 'Resend OTP';
    });
    
    let otpVerificationTimeout = null;
    
    otpDigits.forEach((digit, index) => {
        digit.addEventListener('input', function(e) {
            const value = e.target.value;
            
            if (!/^\d*$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            if (value) {
                e.target.classList.add('filled');
                
                if (index < otpDigits.length - 1) {
                    otpDigits[index + 1].focus();
                }
                
                updateOtpInput();
                
                const otp = Array.from(otpDigits).map(d => d.value).join('');
                if (otp.length === 6) {
                    clearTimeout(otpVerificationTimeout);
                    otpVerificationTimeout = setTimeout(() => {
                        autoVerifyOtp(otp);
                    }, 500);
                }
            }
        });
        
        digit.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpDigits[index - 1].focus();
                otpDigits[index - 1].value = '';
                otpDigits[index - 1].classList.remove('filled');
                updateOtpInput();
            }
        });
        
        digit.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').slice(0, 6);
            
            if (/^\d{6}$/.test(pasteData)) {
                pasteData.split('').forEach((char, i) => {
                    if (otpDigits[i]) {
                        otpDigits[i].value = char;
                        otpDigits[i].classList.add('filled');
                    }
                });
                
                if (otpDigits[pasteData.length - 1]) {
                    otpDigits[pasteData.length - 1].focus();
                }
                
                updateOtpInput();
                
                setTimeout(() => {
                    autoVerifyOtp(pasteData);
                }, 500);
            }
        });
    });
    
    function updateOtpInput() {
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        otpInput.value = otp;
        
        if (verifyOtpBtn) {
            verifyOtpBtn.disabled = otp.length !== 6;
        }
    }
    
    async function autoVerifyOtp(otp) {
        showLoading('Verifying OTP...');
        
        const csrfToken = getCSRFToken();
        
        try {
            const response = await fetch('/teacher-reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'verify_otp',
                    email: currentEmail,
                    otp: otp
                })
            });
            
            const data = await response.json();
            
            hideLoading();
            
            if (data.success) {
                showStep(3);
                showToast('OTP verified successfully!', 'success');
                
                setTimeout(() => {
                    if (newPasswordInput) newPasswordInput.focus();
                }, 500);
            } else {
                showToast(data.error || 'Invalid OTP', 'error');
                otpDigits.forEach(digit => {
                    digit.value = '';
                    digit.classList.remove('filled');
                });
                updateOtpInput();
                if (otpDigits[0]) otpDigits[0].focus();
            }
            
        } catch (error) {
            hideLoading();
            showToast('Network error. Please try again.', 'error');
        }
    }
    
    verifyOtpBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        if (otp.length !== 6) {
            showToast('Please enter 6-digit OTP', 'error');
            return;
        }
        
        await autoVerifyOtp(otp);
    });
    
    newPasswordInput.addEventListener('input', function() {
        const password = newPasswordInput.value;
        checkPasswordStrength(password);
        checkPasswordMatch();
        
        if (password && password.length < 8) {
            showValidationError('password_error', 'Password must be at least 8 characters');
        } else {
            hideValidationError('password_error');
        }
    });
    
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    
    function checkPasswordStrength(password) {
        let score = 0;
        const rules = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        strengthRules.forEach(rule => {
            const ruleType = rule.dataset.rule;
            if (rules[ruleType]) {
                rule.classList.add('valid');
                score++;
            } else {
                rule.classList.remove('valid');
            }
        });
        
        const percentage = (score / 5) * 100;
        strengthFill.style.width = `${percentage}%`;
        
        let strength = 'Weak';
        let color = '#7C3AED';
        
        if (percentage >= 80) {
            strength = 'Strong';
            color = '#A78BFA';
        } else if (percentage >= 60) {
            strength = 'Good';
            color = '#7C3AED';
        } else if (percentage >= 40) {
            strength = 'Fair';
            color = '#7C3AED';
        }
        
        strengthFill.style.background = `linear-gradient(90deg, ${color}, ${color}99)`;
        strengthText.textContent = strength;
        strengthText.style.color = color;
    }
    
    function checkPasswordMatch() {
        const newPass = newPasswordInput?.value || '';
        const confirmPass = confirmPasswordInput?.value || '';
        
        if (!newPass || !confirmPass) {
            if (passwordMatchIndicator) {
                passwordMatchIndicator.textContent = '';
                passwordMatchIndicator.className = 'match-indicator';
            }
            if (resetPasswordBtn) resetPasswordBtn.disabled = true;
            return;
        }
        
        if (newPass === confirmPass) {
            if (passwordMatchIndicator) {
                passwordMatchIndicator.innerHTML = '<svg class="rule-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Passwords match';
                passwordMatchIndicator.className = 'match-indicator match';
            }
            if (resetPasswordBtn) {
                resetPasswordBtn.disabled = false;
                hideValidationError('confirm_password_error');
            }
        } else {
            if (passwordMatchIndicator) {
                passwordMatchIndicator.innerHTML = '<svg class="rule-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Passwords do not match';
                passwordMatchIndicator.className = 'match-indicator mismatch';
            }
            if (resetPasswordBtn) resetPasswordBtn.disabled = true;
            showValidationError('confirm_password_error', 'Passwords do not match');
        }
    }
    
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            const icon = this.querySelector('.eye-icon');
            
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                } else {
                    input.type = 'password';
                }
                
                this.style.transform = 'translateY(-50%) scale(1.2)';
                setTimeout(() => {
                    this.style.transform = 'translateY(-50%) scale(1)';
                }, 200);
            }
        });
    });
    
    document.getElementById('backToOtp')?.addEventListener('click', () => showStep(2));
    
    passwordStep.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;
        
        if (password !== confirmPass) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        if (!validatePasswordStrength(password)) {
            showToast('Password is too weak', 'error');
            return;
        }
        
        showLoading('Resetting password...');
        
        const csrfToken = getCSRFToken();
        
        try {
            const response = await fetch('/teacher-reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'reset_password',
                    email: currentEmail,
                    password: password
                })
            });
            
            const data = await response.json();
            
            hideLoading();
            
            if (data.success) {
                showStep(4);
                showToast('Password reset successfully!', 'success');
            } else {
                showToast(data.error || 'Failed to reset password', 'error');
            }
            
        } catch (error) {
            hideLoading();
            showToast('Network error. Please try again.', 'error');
        }
    });
    
    function validatePasswordStrength(password) {
        return password.length >= 8 &&
               /[A-Z]/.test(password) &&
               /[a-z]/.test(password) &&
               /\d/.test(password) &&
               /[!@#$%^&*(),.?":{}|<>]/.test(password);
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function maskEmail(email) {
        const [name, domain] = email.split('@');
        const maskedName = name.length > 2 ? 
            name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1) : 
            '*'.repeat(name.length);
        return maskedName + '@' + domain;
    }
    
    function getCSRFToken() {
        const csrfTokenElement = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfTokenElement) {
            return csrfTokenElement.value;
        }
        
        const csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        if (csrfCookie) {
            return csrfCookie.split('=')[1];
        }
        
        return '';
    }
    
    function showLoading(message = 'Processing...') {
        if (loadingOverlay) {
            document.body.classList.add('no-scroll');
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.querySelector('p').textContent = message;
        }
    }
    
    function hideLoading() {
        if (loadingOverlay) {
            document.body.classList.remove('no-scroll');
            loadingOverlay.classList.add('hidden');
        }
    }
    
    function showValidationError(fieldId, message) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('active');
        }
    }
    
    function hideValidationError(fieldId) {
        const errorElement = document.getElementById(fieldId);
        if (errorElement) {
            errorElement.classList.remove('active');
        }
    }
    
    function shakeElement(element) {
        if (element) {
            element.style.animation = 'shake 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                element.style.animation = '';
            }, 500);
        }
    }
    
    function addParticles() {
        const particleLayer = document.querySelector('.particle-layer');
        if (!particleLayer) return;
        
        particleLayer.innerHTML = '';
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = 2 + Math.random() * 3;
            const duration = 15 + Math.random() * 15;
            const delay = Math.random() * 20;
            
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            
            const gradients = [
                'linear-gradient(45deg, #7C3AED, #A78BFA)',
                'linear-gradient(45deg, #A78BFA, #7C3AED)',
                'linear-gradient(45deg, #F59E0B, #A78BFA)'
            ];
            particle.style.background = gradients[Math.floor(Math.random() * gradients.length)];
            
            particleLayer.appendChild(particle);
        }
    }
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
        } else if (type === 'error') {
            icon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
        } else {
            icon = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
        }
        
        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.animation = 'fadeOut 0.4s ease forwards';
                    setTimeout(() => toast.remove(), 400);
                }
            }, 4500);
        }
    }
    
    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    }
    
    const closeButtons = ['closeError'];
    closeButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal-overlay');
                if (modal) {
                    hideModal(modal.id);
                }
            });
        }
    });
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal(this.id);
            }
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });
    
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', function() {
            hideModal('errorModal');
        });
    }
    
    function showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        if (modal && errorMessage) {
            modal.classList.add('active');
            document.body.classList.add('no-scroll');
            errorMessage.textContent = message;
        }
    }
    
    showStep(1);
});

const globalAnimations = document.createElement('style');
globalAnimations.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes logoClick {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    @keyframes errorAppear {
        0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.8);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes revealPassword {
        0% { letter-spacing: 0; }
        50% { letter-spacing: 1px; }
        100% { letter-spacing: 0; }
    }
`;
document.head.appendChild(globalAnimations);