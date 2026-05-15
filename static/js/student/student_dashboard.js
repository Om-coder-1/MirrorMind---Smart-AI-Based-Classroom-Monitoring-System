// filename: script.js
document.addEventListener('DOMContentLoaded', function() {
    setupSidebar();
    setupTabs();
    setupNotifications();
    setupJoinButtons();
    setupLogout();
    setupDashboard();
    
    setTimeout(() => {
        let loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }
    }, 1000);
});

function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("active");
}

function getCookie(name) {
    let value = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                value = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return value;
}

let csrftoken = getCookie('csrftoken');

function showToast(message, type = 'info', duration = 5000) {
    let container = document.getElementById('toastContainer');
    if (!container) return;
    
    let toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'toastFadeOut 0.5s ease forwards';
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 500);
        }
    }, duration);
}

function setupSidebar() {
    let sidebar = document.getElementById('sidebar');
    let toggle = document.getElementById('sidebarToggle');
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function setupTabs() {
    let items = document.querySelectorAll('.sidebar-nav li');
    let contents = document.querySelectorAll('.tab-content');
    
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            let tabId = item.getAttribute('data-tab');
            
            items.forEach(tab => tab.classList.remove('active'));
            item.classList.add('active');
            
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                    
                    if (tabId === 'schedules') {
                        loadSchedules('all');
                    } else if (tabId === 'chatbot') {
                        setupChatbot();
                    } else if (tabId === 'notifications') {
                        loadNotifications();
                    }
                }
            });
            
            if (window.innerWidth <= 1200) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });
}

function setupDashboard() {
    let hour = new Date().getHours();
    let timeOfDay = 'day';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';
    
    let welcomeText = document.querySelector('.welcome-text p');
    if (welcomeText) {
        welcomeText.textContent = `Good ${timeOfDay}! Here's your learning dashboard`;
    }
    
    let name = document.getElementById('student_full_name')?.value || 'Student';
    showToast(`Welcome back, ${name}!`, 'success');
}

function setupNotifications() {
    let bell = document.getElementById('notificationBell');
    let dropdown = document.getElementById('notificationDropdown');
    let markAll = document.getElementById('markAllRead');
    
    if (bell && dropdown) {
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
            if (dropdown.classList.contains('active')) {
                loadDropdownNotifications();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!bell.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }
    
    if (markAll) {
        markAll.addEventListener('click', markAllRead);
    }
}

window.removeNotification = function(button, id) {
    event.stopPropagation();
    let item = button.closest('.notification-item, .notification-card');
    
    fetch(`/api/mark-notification-read/${id}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken }
    }).then(() => {
        if (item) {
            item.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                item.remove();
                updateCount();
                
                let container = item.closest('.dropdown-content, .notifications-list');
                if (container && container.children.length === 0) {
                    container.innerHTML = '<div class="no-notifications">No notifications</div>';
                }
            }, 300);
        }
        showToast('Notification removed', 'success');
    }).catch(() => {
        showToast('Failed to remove notification', 'error');
    });
};

async function loadDropdownNotifications() {
    let studentId = document.getElementById('student_id')?.value;
    if (!studentId) return;
    
    try {
        let res = await fetch(`/api/student-notifications/${studentId}/`);
        let data = await res.json();
        
        let list = document.getElementById('notificationsList');
        let count = document.getElementById('headerNotificationCount');
        let dot = document.querySelector('.pulse-dot');
        
        if (data.success && data.notifications && data.notifications.length > 0) {
            let html = '';
            data.notifications.slice(0, 5).forEach(n => {
                html += `
                    <div class="notification-item ${!n.is_read ? 'unread' : ''}" data-id="${n.id}">
                        <div class="notification-icon-small 
                            ${n.type === 'class_started' ? 'success' : n.type === 'schedule_cancelled' ? 'alert' : 'info'}">
                            <i class="fas 
                                ${n.type === 'class_started' ? 'fa-video' : n.type === 'schedule_cancelled' ? 'fa-times-circle' : 'fa-bell'}"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${n.title}</h4>
                            <p>${n.message.substring(0, 50)}${n.message.length > 50 ? '...' : ''}</p>
                            <span class="notification-time">${n.created_at}</span>
                        </div>
                        <button class="notification-close" onclick="removeNotification(this, ${n.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
            list.innerHTML = html;
            
            count.textContent = data.unread_count;
            count.style.display = data.unread_count > 0 ? 'flex' : 'none';
            dot.style.display = data.unread_count > 0 ? 'block' : 'none';
        } else {
            list.innerHTML = '<div class="no-notifications">No notifications</div>';
        }
    } catch (error) {
        console.log(error);
    }
}

async function loadNotifications() {
    let studentId = document.getElementById('student_id')?.value;
    let list = document.getElementById('allNotificationsList');
    if (!list) return;
    
    list.innerHTML = '<div class="loading-spinner">Loading notifications...</div>';
    
    try {
        let res = await fetch(`/api/student-notifications/${studentId}/`);
        let data = await res.json();
        
        if (data.success && data.notifications && data.notifications.length > 0) {
            let html = '';
            data.notifications.forEach(n => {
                html += `
                    <div class="notification-card ${!n.is_read ? 'unread' : ''}" data-id="${n.id}">
                        <div class="notification-icon-large 
                            ${n.type === 'class_started' ? 'success' : n.type === 'schedule_cancelled' ? 'alert' : 'info'}">
                            <i class="fas 
                                ${n.type === 'class_started' ? 'fa-video' : n.type === 'schedule_cancelled' ? 'fa-times-circle' : 'fa-bell'} fa-2x"></i>
                        </div>
                        <div class="notification-content-large">
                            <h3>${n.title}</h3>
                            <p>${n.message}</p>
                            <div class="notification-meta">
                                <span><i class="fas fa-user"></i> ${n.teacher}</span>
                                <span><i class="fas fa-clock"></i> ${n.created_at}</span>
                                ${n.class_name ? `<span><i class="fas fa-users"></i> ${n.class_name}</span>` : ''}
                            </div>
                        </div>
                        ${!n.is_read ? '<span class="unread-badge">New</span>' : ''}
                        <button class="notification-close-large" onclick="removeNotification(this, ${n.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            });
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div class="no-notifications">No notifications found</div>';
        }
    } catch (error) {
        list.innerHTML = '<div class="error-message">Failed to load notifications</div>';
    }
}

async function markAllRead() {
    let studentId = document.getElementById('student_id')?.value;
    if (!studentId) return;
    
    try {
        let res = await fetch(`/api/mark-all-notifications-read/${studentId}/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken }
        });
        
        let data = await res.json();
        if (data.success) {
            document.querySelectorAll('.notification-item.unread, .notification-card.unread').forEach(item => {
                item.classList.remove('unread');
            });
            
            document.getElementById('headerNotificationCount').style.display = 'none';
            document.querySelector('.pulse-dot').style.display = 'none';
            
            showToast('All notifications marked as read', 'success');
        }
    } catch (error) {
        console.log(error);
    }
}

function updateCount() {
    let unread = document.querySelectorAll('.notification-item.unread, .notification-card.unread').length;
    let count = document.getElementById('headerNotificationCount');
    let dot = document.querySelector('.pulse-dot');
    
    if (count) {
        count.textContent = unread;
        count.style.display = unread > 0 ? 'flex' : 'none';
    }
    if (dot) {
        dot.style.display = unread > 0 ? 'block' : 'none';
    }
    
    let badge = document.querySelector('.sidebar-badge');
    if (badge) {
        if (unread > 0) {
            badge.textContent = unread;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function loadSchedules(filter = 'all') {
    let studentId = document.getElementById('student_id')?.value;
    let list = document.getElementById('allSchedulesList');
    if (!list) return;
    
    list.innerHTML = '<div class="loading-spinner">Loading classes...</div>';
    
    try {
        let res = await fetch(`/api/student-schedules/${studentId}/`);
        let data = await res.json();
        
        if (data.success && data.schedules && data.schedules.length > 0) {
            let sorted = [...data.schedules].sort((a, b) => {
                if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
                if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;
                return 0;
            });
            
            let filtered = sorted;
            let today = document.getElementById('today_date')?.value || new Date().toISOString().split('T')[0];
            
            if (filter === 'today') {
                filtered = sorted.filter(s => s.date_raw === today);
            } else if (filter === 'upcoming') {
                filtered = sorted.filter(s => s.is_upcoming && s.status !== 'completed');
            } else if (filter === 'completed') {
                filtered = sorted.filter(s => s.status === 'completed');
            }
            
            if (filtered.length === 0) {
                list.innerHTML = '<div class="no-classes">No classes found</div>';
                return;
            }
            
            let html = '';
            filtered.forEach(s => {
                let statusClass = s.status === 'ongoing' ? 'live' : s.status === 'completed' ? 'completed' : 'upcoming';
                
                html += `
                    <div class="schedule-card ${statusClass}">
                        <div class="schedule-date">
                            <span class="date">${s.date}</span>
                            <span class="time">${s.time}</span>
                        </div>
                        <div class="schedule-details">
                            <h3>${s.subject}</h3>
                            <p><i class="fas fa-user-tie"></i> ${s.teacher}</p>
                        </div>
                        <div class="schedule-status">
                            <span class="badge ${statusClass}">${s.status_display}</span>
                            ${s.can_join ? 
                                `<button class="btn-primary join-schedule-btn" data-schedule-id="${s.id}">
                                    <i class="fas fa-video"></i> Join Now
                                </button>` : ''}
                        </div>
                    </div>
                `;
            });
            list.innerHTML = html;
            
            document.querySelectorAll('.join-schedule-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    joinClass(this.dataset.scheduleId);
                });
            });
        } else {
            list.innerHTML = '<div class="no-classes">No classes scheduled</div>';
        }
    } catch (error) {
        list.innerHTML = '<div class="error-message">Failed to load classes</div>';
    }
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('filter-btn')) {
        let filter = e.target.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        loadSchedules(filter);
    }
});

function setupJoinButtons() {
    document.querySelectorAll('.join-now-btn, .join-schedule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            joinClass(this.dataset.scheduleId);
        });
    });
}

async function joinClass(scheduleId) {
    let studentId = document.getElementById('student_id')?.value;
    
    if (!studentId || !scheduleId) {
        showToast('Invalid class data', 'error');
        return;
    }
    
    try {
        let res = await fetch(`/api/check-class-access/${scheduleId}/${studentId}/`);
        let data = await res.json();
        
        if (data.success && data.can_join) {
            sessionStorage.setItem('joining_schedule_id', scheduleId);
            sessionStorage.setItem('joining_subject', data.subject);
            
            showToast(`Redirecting to attendance for ${data.subject}...`, 'info');
            
            window.location.href = `/attendance/?subject=${encodeURIComponent(data.subject)}&schedule=${scheduleId}`;
        } else {
            showToast(data.message || 'Class not available to join', 'warning');
        }
    } catch (error) {
        showToast('Failed to join class', 'error');
    }
}

function setupLogout() {
    let confirmBtn = document.querySelector('.confirm-logout');
    let cancelBtn = document.querySelector('.cancel-logout');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            showToast('Logging out...', 'info');
            window.location.href = '/student-login/';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            let dashboard = document.querySelector('[data-tab="dashboard"]');
            if (dashboard) {
                dashboard.click();
            }
        });
    }
}

setInterval(() => {
    if (document.querySelector('.notification-dropdown.active')) {
        loadDropdownNotifications();
    }
}, 30000);

let style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: scale(1); }
        to { opacity: 0; transform: scale(0.8); }
    }
`;
document.head.appendChild(style);

class StudyAssistant {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendMessageBtn');
        this.suggestionChips = document.querySelectorAll('.suggestion-chip');
        this.isProcessing = false;
        
        this.init();
    }
    
    init() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.chatInput) {
            this.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            this.chatInput.addEventListener('input', () => {
                this.chatInput.style.height = 'auto';
                this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
            });
        }
        
        this.suggestionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.dataset.question;
                if (question) {
                    this.chatInput.value = question;
                    this.sendMessage();
                }
            });
        });
    }
    
    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isProcessing) return;
        
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
        
        this.addMessage(message, 'user');
        this.showTypingIndicator();
        
        this.isProcessing = true;
        this.sendButton.disabled = true;
        
        try {
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.removeTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            console.error('Chatbot error:', error);
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
        }
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <p>${this.formatMessage(text)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    formatMessage(text) {
        let formatted = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }
    
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot-message';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    async getAIResponse(question) {
        try {
            const res = await fetch("/api/study-chatbot/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken
                },
                body: JSON.stringify({ question: question })
            });

            const data = await res.json();

            if (data.success && data.response) {
                return data.response;
            } else {
                return data.response || "Sorry, I couldn't get an answer right now.";
            }

        } catch (error) {
            console.error("Chatbot API error:", error);
            return "Sorry, there was an error connecting to the server.";
        }
    }
}

function setupChatbot() {
    if (!window.studyAssistant) {
        window.studyAssistant = new StudyAssistant();
    }
}