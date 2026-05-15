// filename: script.js
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
    
    let currentStep = 1;
    let otpTimer = null;
    let otpCountdown = 60;
    let autoRedirectTimer = null;
    let autoRedirectCountdown = 5;
    let currentEmail = '';
    let otpVerificationTimeout = null;
    
    initParticles();
    
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
        
        switch(step) {
            case 1:
                emailStep.style.display = 'block';
                emailStep.classList.add('active');
                break;
            case 2:
                otpStep.style.display = 'block';
                otpStep.classList.add('active');
                startOtpTimer();
                break;
            case 3:
                passwordStep.style.display = 'block';
                passwordStep.classList.add('active');
                break;
            case 4:
                successStep.style.display = 'block';
                successStep.classList.add('active');
                startAutoRedirect();
                break;
        }
        
        const activeStep = document.querySelector('.form-step.active');
        activeStep.style.animation = 'none';
        setTimeout(() => {
            activeStep.style.animation = 'slideInRight 0.5s ease';
        }, 10);
    }
    
    function startOtpTimer() {
        otpCountdown = 60;
        resendOtpBtn.disabled = true;
        resendOtpBtn.textContent = 'Resend OTP';
        
        if (otpTimer) clearInterval(otpTimer);
        
        otpTimer = setInterval(() => {
            otpCountdown--;
            document.getElementById('countdown').textContent = otpCountdown;
            
            if (otpCountdown <= 0) {
                clearInterval(otpTimer);
                resendOtpBtn.disabled = false;
                resendOtpBtn.textContent = 'Resend OTP';
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
                window.location.href = '/login/';
            }
        }, 1000);
    }
    
    document.getElementById('backToEmail').addEventListener('click', () => showStep(1));
    
    emailStep.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailStep.querySelector('input[name="email"]').value.trim();
        if (!email) {
            showToast('Please enter your email address', 'error');
            return;
        }
        
        currentEmail = email;
        otpEmailDisplay.textContent = maskEmail(email);
        
        await handleSendOtp(email);
    });
    
    resendOtpBtn.addEventListener('click', async function() {
        if (resendOtpBtn.disabled || !currentEmail) return;
        
        resendOtpBtn.disabled = true;
        resendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        await handleSendOtp(currentEmail);
        
        startOtpTimer();
    });
    
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
                        handleVerifyOtp(currentEmail, otp);
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
                    handleVerifyOtp(currentEmail, pasteData);
                }, 500);
            }
        });
    });
    
    function updateOtpInput() {
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        otpInput.value = otp;
        verifyOtpBtn.disabled = otp.length !== 6;
    }
    
    otpStep.addEventListener('submit', async function(e) {
        e.preventDefault();
        const otp = otpInput.value;
        if (otp.length !== 6) return;
        await handleVerifyOtp(currentEmail, otp);
    });
    
    async function handleSendOtp(email) {
        showLoading();
        toggleButtonLoading(sendOtpBtn, true);
        
        try {
            const response = await fetch('/student-reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    action: 'send_otp',
                    email: email
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showStep(2);
                showSuccessModal('OTP sent successfully! Check your email.');
                setTimeout(() => otpDigits[0].focus(), 500);
            } else {
                showErrorModal(data.error || 'Failed to send OTP');
            }
        } catch (error) {
            showErrorModal('Network error. Please try again.');
        } finally {
            hideLoading();
            toggleButtonLoading(sendOtpBtn, false);
            if (resendOtpBtn) {
                resendOtpBtn.disabled = false;
                resendOtpBtn.textContent = 'Resend OTP';
            }
        }
    }
    
    async function handleVerifyOtp(email, otp) {
        showLoading();
        toggleButtonLoading(verifyOtpBtn, true);
        
        try {
            const response = await fetch('/student-reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    action: 'verify_otp',
                    email: email,
                    otp: otp
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                hideLoading();
                showStep(3);
                showToast('OTP verified successfully!', 'success');
                setTimeout(() => newPasswordInput.focus(), 500);
            } else {
                showErrorModal(data.error || 'Invalid OTP');
                if (otpDigits) {
                    otpDigits.forEach(digit => {
                        digit.value = '';
                        digit.classList.remove('filled');
                    });
                    updateOtpInput();
                    if (otpDigits[0]) otpDigits[0].focus();
                }
            }
        } catch (error) {
            showErrorModal('Network error. Please try again.');
        } finally {
            hideLoading();
            toggleButtonLoading(verifyOtpBtn, false);
        }
    }
    
    newPasswordInput.addEventListener('input', function() {
        const password = newPasswordInput.value;
        checkPasswordStrength(password);
        checkPasswordMatch();
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
                rule.innerHTML = `<i class="fas fa-check"></i> ${rule.textContent.replace('Minimum ', '').replace('One ', '').replace('One ', '')}`;
                score++;
            } else {
                rule.classList.remove('valid');
                rule.innerHTML = `<i class="fas fa-circle"></i> ${rule.textContent}`;
            }
        });
        
        const percentage = (score / 5) * 100;
        strengthFill.style.width = `${percentage}%`;
        
        let strength = 'Weak';
        let color = '#8B5CF6';
        
        if (percentage >= 80) {
            strength = 'Strong';
            color = '#00F5D4';
        } else if (percentage >= 60) {
            strength = 'Good';
            color = '#00C6FF';
        } else if (percentage >= 40) {
            strength = 'Fair';
            color = '#00C6FF';
        }
        
        strengthFill.style.background = `linear-gradient(90deg, ${color}, ${color}99)`;
        strengthText.textContent = strength;
        strengthText.style.color = color;
    }
    
    function checkPasswordMatch() {
        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;
        
        if (!newPass || !confirmPass) {
            passwordMatchIndicator.textContent = '';
            passwordMatchIndicator.className = 'match-indicator';
            resetPasswordBtn.disabled = true;
            return;
        }
        
        if (newPass === confirmPass) {
            passwordMatchIndicator.innerHTML = '<i class="fas fa-check"></i> Passwords match';
            passwordMatchIndicator.className = 'match-indicator match';
            resetPasswordBtn.disabled = false;
        } else {
            passwordMatchIndicator.innerHTML = '<i class="fas fa-times"></i> Passwords do not match';
            passwordMatchIndicator.className = 'match-indicator mismatch';
            resetPasswordBtn.disabled = true;
        }
    }
    
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                if(icon) icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                if(icon) icon.className = 'fas fa-eye';
            }
        });
    });
    
    document.getElementById('backToOtp').addEventListener('click', () => showStep(2));
    
    passwordStep.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;
        
        if (password !== confirmPass) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        showLoading('Resetting password...');
        toggleButtonLoading(resetPasswordBtn, true);
        
        try {
            const response = await fetch('/student-reset-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({ 
                    action: 'reset_password',
                    email: currentEmail,
                    password: password 
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                hideLoading();
                showStep(4);
                showToast('Password reset successfully!', 'success');
            } else {
                showErrorModal(data.error || 'Failed to reset password');
            }
        } catch (error) {
            showErrorModal('Network error. Please try again.');
        } finally {
            hideLoading();
            toggleButtonLoading(resetPasswordBtn, false);
        }
    });
    
    function maskEmail(email) {
        const [name, domain] = email.split('@');
        const maskedName = name.length > 2 ? 
            name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1) : 
            '*'.repeat(name.length);
        return maskedName + '@' + domain;
    }
    
    function showLoading(message = 'Processing...') {
        document.body.classList.add('no-scroll');
        document.getElementById('loadingModal').classList.add('active');
        document.querySelector('.loading-text').textContent = message;
    }
    
    function hideLoading() {
        document.body.classList.remove('no-scroll');
        document.getElementById('loadingModal').classList.remove('active');
    }
    
    function toggleButtonLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        
        if (isLoading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline-block';
            button.disabled = true;
        } else {
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            button.disabled = false;
        }
    }
    
    function showSuccessModal(message) {
        document.getElementById('successMessage').textContent = message;
        document.getElementById('successModal').classList.add('active');
        document.body.classList.add('no-scroll');
        
        setTimeout(() => {
            hideModal('successModal');
        }, 3000);
    }
    
    function showErrorModal(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').classList.add('active');
        document.body.classList.add('no-scroll');
    }
    
    window.hideModal = function(modalId) {
        document.getElementById(modalId).classList.remove('active');
        document.body.classList.remove('no-scroll');
    }
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} toast-icon"></i>
            <div class="toast-content">
                <p>${message}</p>
            </div>
            <button class="toast-close">×</button>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        });
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }
    
    function getCSRFToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }
    
    function initParticles() {
        const particleLayer = document.querySelector('.particle-layer');
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.setProperty('--i', Math.random());
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particleLayer.appendChild(particle);
        }
    }
    
    showStep(1);
});