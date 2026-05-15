// filename: script.js
const toast = {
    container: document.getElementById('toastContainer'),

    show: function(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            error: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
            warning: '<svg viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 4l8.5 15h-17L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>',
            info: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
        };

        toast.innerHTML = `
            ${icons[type] || icons.info}
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'toastFadeOut 0.5s ease forwards';
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 500);
            }
        }, duration);

        toast.addEventListener('click', (e) => {
            if (!e.target.classList.contains('toast-close')) {
                toast.remove();
            }
        });

        return toast;
    },

    success: function(message, duration = 5000) {
        return this.show(message, 'success', duration);
    },

    error: function(message, duration = 5000) {
        return this.show(message, 'error', duration);
    },

    warning: function(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    },

    info: function(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const collegeCode = document.getElementById('college_code');
    const collegeName = document.getElementById('college_name');
    const collegeId = document.getElementById('college_id');
    const deptSelect = document.getElementById('department_select');
    const deptInput = document.getElementById('department_input');
    const email = document.getElementById('email');
    const verificationEmail = document.getElementById('verificationEmail');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const sendOtpContainer = document.getElementById('sendOtpContainer');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const otpDigits = document.querySelectorAll('.otp-digit');
    const otpHidden = document.getElementById('otp');
    const otpCountdown = document.getElementById('otpCountdown');
    const otpVerificationResult = document.getElementById('otpVerificationResult');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.getElementById('strengthText');
    const passwordMatch = document.getElementById('passwordMatch');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const form = document.getElementById('teacherSignupForm');
    const steps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step');
    const progressFill = document.getElementById('progressFill');
    const prevBtn = document.querySelector('.btn-prev');
    const terms = document.getElementById('terms');

    let otpTimer = null;
    let otpExpiryTime = null;
    let isOtpVerified = false;
    let currentStep = 1;
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    let collegeCodeTimeout;
    collegeCode.addEventListener('input', function() {
        clearTimeout(collegeCodeTimeout);
        collegeCodeTimeout = setTimeout(() => {
            const code = this.value.trim();
            if (code.length >= 3) lookupCollege(code);
        }, 500);
    });

    collegeCode.addEventListener('blur', function() {
        const code = this.value.trim();
        if (code) lookupCollege(code);
    });

    function lookupCollege(code) {
        if (!code) return;

        fetch(`/api/check-college/?college_code=${code}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.exists) {
                collegeName.value = data.college_name;
                collegeId.value = data.college_id;
                loadDepartments(data.college_id);
                toast.success('✓ College found successfully!', 4000);
            } else {
                collegeName.value = '';
                collegeId.value = '';
                deptSelect.innerHTML = '<option value="">Select Department</option>';
                toast.warning('⚠️ College not found. Please enter college name to add.', 5000);
                let name = prompt("Enter College Name to Add:");
                if (name && name.trim() !== "") {
                    fetch("/api/add-college/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrfToken
                        },
                        body: JSON.stringify({ college_code: code, college_name: name })
                    })
                    .then(response => response.json())
                    .then(newCollege => {
                        collegeName.value = name;
                        collegeId.value = newCollege.college_id;
                        toast.success("✓ College added successfully!");
                    })
                    .catch(error => {
                        console.error(error);
                        toast.error("✗ Failed to add college");
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            toast.error('✗ Failed to lookup college. Please try again.');
        });
    }

    function loadDepartments(collegeId) {
        fetch(`/api/get-departments/${collegeId}/`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        })
        .then(response => response.json())
        .then(data => {
            deptSelect.innerHTML = '<option value="">Select Department</option>';
            if (data.departments && data.departments.length > 0) {
                data.departments.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.id;
                    option.textContent = dept.name;
                    deptSelect.appendChild(option);
                });
            } else {
                deptSelect.innerHTML = '<option value="">No departments found</option>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            toast.error('✗ Failed to load departments');
        });
    }

    deptSelect.addEventListener('change', function() {
        if (this.value) {
            deptInput.disabled = true;
            deptInput.value = '';
        } else {
            deptInput.disabled = false;
        }
    });

    deptInput.addEventListener('input', function() {
        if (this.value.trim()) {
            deptSelect.disabled = true;
            deptSelect.value = '';
        } else {
            deptSelect.disabled = false;
        }
    });

    sendOtpBtn.addEventListener('click', function() {
        const emailVal = email.value.trim();

        if (!validateEmail(emailVal)) {
            showError('email_error', 'Please enter a valid email address');
            toast.error('✗ Please enter a valid email address');
            return;
        }

        if (!validateStep1()) return;

        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<span class="btn-text">Sending Code...</span><div class="spinner"></div>';

        fetch('/teacher/send-otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ email: emailVal })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                verificationEmail.textContent = emailVal;
                otpSection.classList.remove('hidden');
                sendOtpContainer.classList.add('hidden');
                startOtpTimer(300);
                toast.success('✓ Verification code sent to your email!', 5000);
                otpDigits[0].focus();
            } else {
                toast.error('✗ ' + (data.error || 'Failed to send OTP'));
                sendOtpBtn.disabled = false;
                sendOtpBtn.innerHTML = '<span class="btn-text">Continue to Verification</span><svg class="btn-icon" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            toast.error('✗ Failed to send OTP. Please try again.');
            sendOtpBtn.disabled = false;
            sendOtpBtn.innerHTML = '<span class="btn-text">Continue to Verification</span><svg class="btn-icon" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';
        });
    });

    otpDigits.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value) {
                this.classList.add('filled');
                if (index < otpDigits.length - 1) otpDigits[index + 1].focus();
            } else {
                this.classList.remove('filled');
            }
            updateOtpHidden();
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                otpDigits[index - 1].focus();
            }
        });

        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = e.clipboardData.getData('text');
            const digits = paste.replace(/[^0-9]/g, '').split('');
            digits.forEach((digit, i) => {
                if (i + index < otpDigits.length) {
                    otpDigits[i + index].value = digit;
                    otpDigits[i + index].classList.add('filled');
                }
            });
            updateOtpHidden();
            otpDigits[Math.min(index + digits.length, otpDigits.length - 1)].focus();
        });
    });

    function updateOtpHidden() {
        const otp = Array.from(otpDigits).map(input => input.value).join('');
        otpHidden.value = otp;
    }

    verifyOtpBtn.addEventListener('click', function() {
        const otp = otpHidden.value;

        if (otp.length !== 6) {
            toast.error('✗ Please enter complete 6-digit OTP');
            return;
        }

        verifyOtpBtn.classList.add('loading');
        verifyOtpBtn.disabled = true;

        fetch('/teacher/verify-otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ email: email.value.trim(), otp: otp })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                isOtpVerified = true;
                if (otpTimer) clearInterval(otpTimer);
                otpVerificationResult.classList.remove('hidden');
                toast.success('✓ Email verified successfully!', 5000);
                setTimeout(() => goToStep(2), 1500);
            } else {
                toast.error('✗ ' + (data.error || 'Invalid OTP'));
                otpDigits.forEach(input => {
                    input.classList.add('error');
                    setTimeout(() => input.classList.remove('error'), 500);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            toast.error('✗ Verification failed. Please try again.');
        })
        .finally(() => {
            verifyOtpBtn.classList.remove('loading');
            verifyOtpBtn.disabled = false;
        });
    });

    resendOtpBtn.addEventListener('click', function() {
        resendOtpBtn.disabled = true;

        fetch('/teacher/resend-otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ email: email.value.trim() })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                startOtpTimer(300);
                toast.success('✓ New verification code sent!', 5000);
            } else {
                toast.error('✗ ' + (data.error || 'Failed to resend OTP'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            toast.error('✗ Failed to resend OTP');
        })
        .finally(() => {
            setTimeout(() => { resendOtpBtn.disabled = false; }, 30000);
        });
    });

    function startOtpTimer(seconds) {
        if (otpTimer) clearInterval(otpTimer);
        otpExpiryTime = Date.now() + seconds * 1000;

        otpTimer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((otpExpiryTime - now) / 1000));

            if (remaining <= 0) {
                clearInterval(otpTimer);
                otpCountdown.textContent = '00:00';
                resendOtpBtn.disabled = false;
                toast.warning('⚠️ OTP expired. Please request a new one.', 5000);
                return;
            }

            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            otpCountdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    password.addEventListener('input', checkPasswordStrength);
    confirmPassword.addEventListener('input', checkPasswordMatch);

    function checkPasswordStrength() {
        const pass = password.value;

        if (pass.length === 0) {
            strengthBar.className = 'strength-bar';
            strengthText.textContent = 'None';
            return;
        }

        let strength = 0;
        if (pass.length >= 8) strength++;
        if (pass.match(/[a-z]/)) strength++;
        if (pass.match(/[A-Z]/)) strength++;
        if (pass.match(/[0-9]/)) strength++;
        if (pass.match(/[^a-zA-Z0-9]/)) strength++;

        strengthBar.classList.remove('weak', 'medium', 'strong');
        if (strength <= 1) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak';
        } else if (strength <= 3) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong';
        }
    }

    function checkPasswordMatch() {
        const pass = password.value;
        const confirm = confirmPassword.value;

        if (confirm.length === 0) {
            passwordMatch.classList.remove('visible');
            return;
        }

        if (pass === confirm) {
            passwordMatch.classList.add('visible');
            passwordMatch.textContent = '✓ Passwords match';
        } else {
            passwordMatch.classList.remove('visible');
        }
    }

    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const target = document.getElementById(this.dataset.target);
            target.type = target.type === 'password' ? 'text' : 'password';
        });
    });

    function validateStep1() {
        let isValid = true;
        const firstName = document.getElementById('first_name').value.trim();
        const lastName = document.getElementById('last_name').value.trim();
        const teacherId = document.getElementById('teacher_id').value.trim();
        const emailVal = email.value.trim();
        const collegeCodeVal = collegeCode.value.trim();
        const departmentSelected = deptSelect.value;
        const departmentNew = deptInput.value.trim();

        if (!firstName) { showError('first_name_error', 'First name is required'); isValid = false; } else hideError('first_name_error');
        if (!lastName) { showError('last_name_error', 'Last name is required'); isValid = false; } else hideError('last_name_error');
        if (!teacherId) { showError('teacher_id_error', 'Teacher ID is required'); isValid = false; } else hideError('teacher_id_error');
        if (!validateEmail(emailVal)) { showError('email_error', 'Valid email is required'); isValid = false; } else hideError('email_error');
        if (!collegeCodeVal) { showError('college_code_error', 'College code is required'); isValid = false; } else hideError('college_code_error');
        if (!collegeId.value) { showError('college_code_error', 'Please lookup a valid college code'); isValid = false; }
        if (!departmentSelected && !departmentNew) { showError('department_error', 'Please select or enter a department'); isValid = false; } else hideError('department_error');
        if (!terms.checked) { showError('terms_error', 'You must accept the terms'); isValid = false; } else hideError('terms_error');

        return isValid;
    }

    function validateStep2() {
        let isValid = true;
        const pass = password.value;
        const confirm = confirmPassword.value;

        if (!pass) { showError('password_error', 'Password is required'); isValid = false; }
        else if (pass.length < 8) { showError('password_error', 'Password must be at least 8 characters'); isValid = false; }
        else hideError('password_error');

        if (!confirm) { showError('confirm_password_error', 'Please confirm your password'); isValid = false; }
        else if (pass !== confirm) { showError('confirm_password_error', 'Passwords do not match'); isValid = false; }
        else hideError('confirm_password_error');

        return isValid;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(id, message) {
        const el = document.getElementById(id);
        if (el) { el.textContent = message; el.classList.add('active'); }
    }

    function hideError(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    }

    function goToStep(step) {
        steps.forEach(s => s.classList.remove('active'));
        stepIndicators.forEach(s => s.classList.remove('active'));
        document.getElementById(`step${step}`).classList.add('active');
        stepIndicators[step - 1].classList.add('active');
        progressFill.style.width = step === 1 ? '50%' : '100%';
        currentStep = step;
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() { goToStep(1); });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validateStep2()) {
            toast.error('✗ Please fix the errors in the form');
            return;
        }

        if (!isOtpVerified) {
            toast.error('✗ Please verify your email first');
            goToStep(1);
            return;
        }

        loadingOverlay.classList.remove('hidden');

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrfToken);
        formData.append('first_name', document.getElementById('first_name').value.trim());
        formData.append('last_name', document.getElementById('last_name').value.trim());
        formData.append('teacher_id', document.getElementById('teacher_id').value.trim());
        formData.append('email', email.value.trim());
        formData.append('college_id', collegeId.value);

        if (deptSelect.value) formData.append('department_id', deptSelect.value);
        else if (deptInput.value.trim()) formData.append('department_name', deptInput.value.trim());

        formData.append('qualification', document.getElementById('qualification').value);
        formData.append('experience', document.getElementById('experience').value);
        formData.append('password', password.value);
        formData.append('confirm_password', confirmPassword.value);
        formData.append('terms', terms.checked ? 'true' : '');

        fetch('/teacher-signup/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loadingOverlay.classList.add('hidden');

            if (data.success) {
                toast.success('✓ Account created successfully! Redirecting...', 3000);
                setTimeout(() => { window.location.href = data.redirect; }, 2000);
            } else {
                toast.error('✗ ' + (data.error || 'Failed to create account'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loadingOverlay.classList.add('hidden');
            toast.error('✗ Network error. Please try again.');
        });
    });

    const card = document.querySelector('.signup-card');
    if (card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
    }

    stepIndicators.forEach(indicator => {
        indicator.addEventListener('click', function() {
            const step = parseInt(this.dataset.step);
            if (step === 2 && !isOtpVerified) {
                toast.warning('⚠️ Please verify your email first');
                return;
            }
            goToStep(step);
        });
    });
});