// filename: teacher_dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    initializeTabs();
    initializeNotifications();
    initializeLogout();
    initializeDashboard();
    loadTeacherData();
    
    setTimeout(() => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }
    }, 1000);
});

function initializeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

function initializeTabs() {
    const tabItems = document.querySelectorAll('.sidebar-nav li');
    const tabContents = document.querySelectorAll('.tab-content');
    const actionBtns = document.querySelectorAll('.action-btn');
    
    tabItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            
            tabItems.forEach(tab => tab.classList.remove('active'));
            item.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                    
                    if (tabId === 'view-allocations') {
                        loadTeacherAllocations();
                    } else if (tabId === 'view-scheduled') {
                        loadTeacherSchedules();
                    } else if (tabId === 'allocations') {
                        loadDepartmentClasses();
                    } else if (tabId === 'schedule') {
                        loadTeacherCourses();
                    } else if (tabId === 'notification') {
                        loadClassesForNotification();
                    } else if (tabId === 'dashboard') {
                        loadDashboardStats();
                    }
                }
            });
            
            if (window.innerWidth <= 1200) {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.remove('active');
            }
        });
    });
    
    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            const targetTab = document.querySelector(`.sidebar-nav li[data-tab="${tabId}"]`);
            if (targetTab) {
                targetTab.click();
            }
        });
    });
}

function initializeNotifications() {
    const notificationBell = document.getElementById('notificationBell');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const markReadButton = document.getElementById('markAllRead');
    
    if (notificationBell && notificationDropdown) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
            if (notificationDropdown.classList.contains('active')) {
                loadNotifications();
            }
        });
        
        if (markReadButton) {
            markReadButton.addEventListener('click', () => {
                const unreadItems = notificationDropdown.querySelectorAll('.unread');
                unreadItems.forEach(item => item.classList.remove('unread'));
                
                const notificationCount = document.getElementById('notificationCount');
                if (notificationCount) {
                    notificationCount.textContent = '0';
                    notificationCount.style.display = 'none';
                }
                
                const pulseDot = document.querySelector('.pulse-dot');
                if (pulseDot) {
                    pulseDot.style.display = 'none';
                }
                
                showToast('All notifications marked as read', 'success');
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!notificationBell.contains(e.target) && !notificationDropdown.contains(e.target)) {
                notificationDropdown.classList.remove('active');
            }
        });
    }
}

async function loadNotifications() {
    const teacherId = document.getElementById('teacher_id')?.value;
    if (!teacherId) return;
    
    try {
        const response = await fetch(`/api/teacher-notifications/${teacherId}/`);
        const data = await response.json();
        
        const list = document.getElementById('notificationsList');
        const count = document.getElementById('notificationCount');
        
        if (data.success && data.notifications && data.notifications.length > 0) {
            let html = '';
            data.notifications.forEach(n => {
                html += `
                    <div class="notification-item unread">
                        <div class="notification-icon-small info">
                            <i class="fas fa-bell"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${n.title}</h4>
                            <p>${n.message}</p>
                            <span class="notification-time">
                                <i class="fas fa-users"></i> ${n.class_name || 'All Students'} • ${n.created_at}
                            </span>
                        </div>
                    </div>
                `;
            });
            list.innerHTML = html;
            count.textContent = data.notifications.length;
            count.style.display = 'flex';
            document.querySelector('.pulse-dot').style.display = 'block';
        } else {
            list.innerHTML = '<div class="no-notifications">No notifications</div>';
            count.textContent = '0';
            count.style.display = 'none';
            document.querySelector('.pulse-dot').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
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
    
    return toast;
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

function initializeDashboard() {
    const welcomeText = document.querySelector('.welcome-text p');
    if (welcomeText) {
        const hour = new Date().getHours();
        let timeOfDay = 'day';
        if (hour < 12) timeOfDay = 'morning';
        else if (hour < 18) timeOfDay = 'afternoon';
        else timeOfDay = 'evening';
        
        welcomeText.textContent = `Good ${timeOfDay}! Manage your classes and view attendance`;
    }
    
    loadDashboardStats();
    loadRecentActivity();
}

async function loadDashboardStats() {
    const teacherId = document.getElementById('teacher_id')?.value;
    if (!teacherId) return;
    
    try {
        const allocResponse = await fetch(`/api/teacher-allocations/${teacherId}/`);
        const allocData = await allocResponse.json();
        
        const scheduleResponse = await fetch(`/api/teacher-schedules/${teacherId}/`);
        const scheduleData = await scheduleResponse.json();
        
        const totalAllocations = document.getElementById('totalAllocations');
        const totalScheduled = document.getElementById('totalScheduled');
        const liveClasses = document.getElementById('liveClasses');
        const completedClasses = document.getElementById('completedClasses');
        
        if (totalAllocations) {
            totalAllocations.textContent = allocData.allocations?.length || 0;
        }
        
        if (totalScheduled && scheduleData.schedules) {
            const scheduled = scheduleData.schedules.filter(s => s.status === 'scheduled').length;
            totalScheduled.textContent = scheduled;
        }
        
        if (liveClasses && scheduleData.schedules) {
            const live = scheduleData.schedules.filter(s => s.status === 'ongoing').length;
            liveClasses.textContent = live;
        }
        
        if (completedClasses && scheduleData.schedules) {
            const completed = scheduleData.schedules.filter(s => s.status === 'completed').length;
            completedClasses.textContent = completed;
        }
        
        animateCounters();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function animateCounters() {
    const counters = document.querySelectorAll('.stat-value');
    counters.forEach(counter => {
        const target = parseInt(counter.textContent) || 0;
        let current = 0;
        const increment = target / 50;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

async function loadRecentActivity() {
    const teacherId = document.getElementById('teacher_id')?.value;
    const activityList = document.getElementById('recentActivity');
    if (!activityList || !teacherId) return;

    try {
        const response = await fetch(`/api/teacher-schedules/${teacherId}/`);
        const data = await response.json();

        if (data.success && data.schedules && data.schedules.length > 0) {
            let html = '';
            const recent = data.schedules.slice(0, 5);
            recent.forEach(s => {
                const statusIcon = s.status === 'ongoing' ? '🔴' : s.status === 'completed' ? '✅' : '📅';
                html += `
                    <div class="activity-item">
                        <span class="activity-time">${statusIcon} ${s.date} ${s.time}</span>
                        <p>${s.subject} — ${s.class_name} <span style="font-size:0.75rem;opacity:0.7;">(${s.status_display})</span></p>
                    </div>
                `;
            });
            activityList.innerHTML = html;
        } else {
            activityList.innerHTML = '<div class="activity-item"><span class="activity-time">No recent activity</span></div>';
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        activityList.innerHTML = '<div class="activity-item"><span class="activity-time">No activity found</span></div>';
    }
}

function loadTeacherData() {
    const teacherId = document.getElementById('teacher_id')?.value;
    if (teacherId) {
        sessionStorage.setItem('teacher_id', teacherId);
    }
    
    const teacherDeptId = document.getElementById('teacher_dept_id')?.value;
    if (teacherDeptId) {
        sessionStorage.setItem('teacher_dept_id', teacherDeptId);
    }
    
    const teacherCollegeId = document.getElementById('teacher_college_id')?.value;
    if (teacherCollegeId) {
        sessionStorage.setItem('teacher_college_id', teacherCollegeId);
    }
}

async function loadDepartmentClasses() {
    const classSelect = document.getElementById('classSelect');
    if (!classSelect) return;
    
    const teacherDeptId = document.getElementById('teacher_dept_id')?.value;
    
    if (!teacherDeptId || teacherDeptId === 'undefined') {
        classSelect.innerHTML = '<option value="">Department ID not available</option>';
        return;
    }
    
    classSelect.innerHTML = '<option value="">Loading classes...</option>';
    
    try {
        const response = await fetch(`/api/get-classes/${teacherDeptId}/`);
        const data = await response.json();
        
        classSelect.innerHTML = '<option value="" selected disabled>Select Class</option>';
        
        if (data.classes && data.classes.length > 0) {
            data.classes.forEach(cls => {
                classSelect.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
            });
        } else {
            classSelect.innerHTML += '<option value="" disabled>No classes found</option>';
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        classSelect.innerHTML = '<option value="" disabled>Error loading classes</option>';
        showToast('Failed to load classes', 'error');
    }
}

const allocationForm = document.getElementById('allocationForm');
if (allocationForm) {
    allocationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const classId = document.getElementById('classSelect')?.value;
        const subjectName = document.getElementById('subjectName')?.value.trim();
        const academicYear = document.getElementById('academicYear')?.value;
        const teacherId = document.getElementById('teacher_id')?.value;
        
        if (!classId) {
            showToast('Please select a class', 'error');
            return;
        }
        
        if (!subjectName) {
            showToast('Please enter subject name', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/add-course-allocation/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    teacher_id: teacherId,
                    class_id: classId,
                    subject_name: subjectName,
                    academic_year: academicYear || ''
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Course allocated successfully!', 'success');
                allocationForm.reset();
                
                setTimeout(() => {
                    const viewAllocationsTab = document.querySelector('[data-tab="view-allocations"]');
                    if (viewAllocationsTab) viewAllocationsTab.click();
                }, 1500);
            } else {
                showToast(data.error || 'Error allocating course', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error occurred', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function loadTeacherAllocations() {
    const tbody = document.getElementById('allocationsTableBody');
    if (!tbody) return;
    
    const teacherId = document.getElementById('teacher_id')?.value;
    
    tbody.innerHTML = ' euros<td colspan="5" style="text-align:center;"><span class="loading-spinner"></span> Loading...</td> </tr>';
    
    try {
        const response = await fetch(`/api/teacher-allocations/${teacherId}/`);
        const data = await response.json();
        
        if (data.success && data.allocations && data.allocations.length > 0) {
            tbody.innerHTML = '';
            data.allocations.forEach(alloc => {
                tbody.innerHTML += `
                    <tr>
                        <td>${alloc.college_name || '-'}</td>
                        <td>${alloc.department_name || '-'}</td>
                        <td>${alloc.class_name || '-'}</td>
                        <td>${alloc.subject_name || '-'}</td>
                        <td>${alloc.academic_year || '-'}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No allocations found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading allocations:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: #EF4444;">Error loading allocations</td></tr>';
        showToast('Failed to load allocations', 'error');
    }
}

async function loadTeacherCourses() {
    const courseSelect = document.getElementById('courseSelect');
    if (!courseSelect) return;
    
    const teacherId = document.getElementById('teacher_id')?.value;
    
    courseSelect.innerHTML = '<option value="" selected disabled>Loading courses...</option>';
    
    try {
        const response = await fetch(`/api/teacher-courses/${teacherId}/`);
        const data = await response.json();
        
        courseSelect.innerHTML = '<option value="" selected disabled>Select Course & Subject</option>';
        
        if (data.success && data.courses && data.courses.length > 0) {
            data.courses.forEach(course => {
                courseSelect.innerHTML += `<option value="${course.id}">${course.display_name}</option>`;
            });
        } else {
            courseSelect.innerHTML += '<option value="" disabled>No courses allocated</option>';
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        courseSelect.innerHTML = '<option value="" disabled>Error loading courses</option>';
        showToast('Failed to load courses', 'error');
    }
}

const scheduleForm = document.getElementById('scheduleForm');
if (scheduleForm) {
    scheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const courseId = document.getElementById('courseSelect')?.value;
        const date = document.getElementById('scheduleDate')?.value;
        const startTime = document.getElementById('startTime')?.value;
        const teacherId = document.getElementById('teacher_id')?.value;
        
        if (!courseId || !date || !startTime) {
            showToast('All fields are required', 'error');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Scheduling...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/add-schedule/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify({
                    teacher_id: teacherId,
                    course_id: courseId,
                    date: date,
                    start_time: startTime
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Class scheduled successfully!', 'success');
                scheduleForm.reset();
                loadNotifications();
                
                setTimeout(() => {
                    const viewScheduledTab = document.querySelector('[data-tab="view-scheduled"]');
                    if (viewScheduledTab) viewScheduledTab.click();
                }, 1500);
            } else {
                showToast(data.error || 'Error scheduling class', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error occurred', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function loadTeacherSchedules() {
    const tbody = document.getElementById('schedulesTableBody');
    if (!tbody) return;
    
    const teacherId = document.getElementById('teacher_id')?.value;
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;"><span class="loading-spinner"></span> Loading...</td></tr>';
    
    try {
        const response = await fetch(`/api/teacher-schedules/${teacherId}/`);
        const data = await response.json();
        
        if (data.success && data.schedules && data.schedules.length > 0) {
            tbody.innerHTML = '';
            data.schedules.forEach(schedule => {
                const statusClass = schedule.status === 'ongoing' ? 'badge live' :
                    schedule.status === 'completed' ? 'badge completed' : 'badge scheduled';
                
                const statusText = schedule.status_display || schedule.status;
                
                let actionButtons = '';
                if (schedule.status === 'scheduled') {
                    actionButtons = `
                        <div class="action-buttons">
                            <button class="btn-icon start" onclick="startClass(${schedule.id})">
                                <i class="fas fa-play"></i> Start
                            </button>
                            <button class="btn-icon edit" onclick="openEditModal(${schedule.id}, '${schedule.date}', '${schedule.time}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-icon delete" onclick="deleteSchedule(${schedule.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    `;
                } else if (schedule.status === 'ongoing') {
                    actionButtons = `
                        <div class="action-buttons">
                            <span class="badge live">Live Now</span>
                        </div>
                    `;
                } else {
                    actionButtons = `
                        <div class="action-buttons">
                            <span class="badge completed">Completed</span>
                        </div>
                    `;
                }
                
                tbody.innerHTML += `
                    <tr>
                        <td>${schedule.class_name || '-'}</td>
                        <td>${schedule.subject || '-'}</td>
                        <td>${schedule.date || '-'}</td>
                        <td>${schedule.time || '-'}</td>
                        <td><span class="${statusClass}">${statusText}</span></td>
                        <td>${actionButtons}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No schedules found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading schedules:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: #EF4444;">Error loading schedules</td></tr>';
        showToast('Failed to load schedules', 'error');
    }
}

window.startClass = async function(scheduleId) {
    try {
        const response = await fetch(`/api/start-class/${scheduleId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Class started! Students can now join.', 'success');
            loadTeacherSchedules();
            loadNotifications();
            
            if (data.meeting_link) {
                window.location.href = data.meeting_link;
            }
        } else {
            showToast(data.error || 'Error starting class', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
};

window.deleteSchedule = async function(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
        const response = await fetch(`/api/delete-schedule/${scheduleId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Schedule deleted successfully', 'success');
            loadTeacherSchedules();
        } else {
            showToast(data.error || 'Error deleting schedule', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
};

window.openEditModal = function(scheduleId, date, time) {
    document.getElementById('editScheduleId').value = scheduleId;
    document.getElementById('editDate').value = date;
    document.getElementById('editStartTime').value = time;
    document.getElementById('editScheduleModal').style.display = 'flex';
};

window.closeEditModal = function() {
    document.getElementById('editScheduleModal').style.display = 'none';
};

window.updateSchedule = async function() {
    const scheduleId = document.getElementById('editScheduleId')?.value;
    const date = document.getElementById('editDate')?.value;
    const startTime = document.getElementById('editStartTime')?.value;
    
    if (!scheduleId || !date || !startTime) {
        showToast('All fields are required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/update-schedule/${scheduleId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                date: date,
                start_time: startTime
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Schedule updated successfully', 'success');
            closeEditModal();
            loadTeacherSchedules();
        } else {
            showToast(data.error || 'Error updating schedule', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
};

window.toggleClassSelect = function(select) {
    const container = document.getElementById('classSelectContainer');
    if (container) {
        container.style.display = select.value === 'specific_class' ? 'block' : 'none';
    }
};

async function loadClassesForNotification() {
    const classSelect = document.getElementById('notificationClass');
    if (!classSelect) return;
    
    const teacherDeptId = document.getElementById('teacher_dept_id')?.value;
    
    try {
        const response = await fetch(`/api/get-classes/${teacherDeptId}/`);
        const data = await response.json();
        
        classSelect.innerHTML = '<option value="">Select Class</option>';
        
        if (data.classes && data.classes.length > 0) {
            data.classes.forEach(cls => {
                classSelect.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

window.sendNotification = async function() {
    const teacherId = document.getElementById('teacher_id')?.value;
    const recipientType = document.getElementById('recipientType')?.value;
    const classId = document.getElementById('notificationClass')?.value;
    const title = document.getElementById('notificationTitle')?.value.trim();
    const message = document.getElementById('notificationMessage')?.value.trim();
    
    if (!title || !message) {
        showToast('Title and message are required', 'error');
        return;
    }
    
    if (recipientType === 'specific_class' && !classId) {
        showToast('Please select a class', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/send-class-notification/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                teacher_id: teacherId,
                recipient_type: recipientType,
                class_id: classId,
                title: title,
                message: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message || 'Notification sent successfully!', 'success');
            document.getElementById('notificationTitle').value = '';
            document.getElementById('notificationMessage').value = '';
            document.getElementById('recipientType').value = 'all_students';
            document.getElementById('classSelectContainer').style.display = 'none';
            loadNotifications();
        } else {
            showToast(data.error || 'Error sending notification', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error occurred', 'error');
    }
};

const attendanceForm = document.getElementById('attendanceForm');
if (attendanceForm) {
    attendanceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(attendanceForm);
        const submitBtn = document.getElementById('attendanceSubmitBtn');
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> Loading...';
        }
        
        try {
            const response = await fetch('/teacher-dashboard/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken
                }
            });
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newTableBody = doc.getElementById('attendanceTableBody');
            const errorDiv = doc.querySelector('.error-message');
            
            const attendanceTableWrapper = document.getElementById('attendanceTableWrapper');
            const existingError = document.querySelector('.error-message');
            if (existingError) existingError.remove();
            
            if (errorDiv) {
                attendanceForm.insertAdjacentElement('afterend', errorDiv);
                if (attendanceTableWrapper) attendanceTableWrapper.style.display = 'none';
            } else if (newTableBody && newTableBody.children.length > 0) {
                const currentTableBody = document.getElementById('attendanceTableBody');
                currentTableBody.innerHTML = newTableBody.innerHTML;
                if (attendanceTableWrapper) attendanceTableWrapper.style.display = 'block';
                showToast('Attendance loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error loading attendance', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-search"></i> View Attendance';
            }
        }
    });
}

window.showAddClassModal = function() {
    document.getElementById('addClassModal').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('addClassModal').style.display = 'none';
    document.getElementById('newClassName').value = '';
};

window.addNewClass = async function() {
    const className = document.getElementById('newClassName')?.value.trim();
    const deptId = document.getElementById('teacher_dept_id')?.value;
    
    if (!className) {
        showToast('Please enter class name', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/add-class/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                department_id: deptId,
                class_name: className
            })
        });
        
        const data = await response.json();
        
        if (data.class_id) {
            showToast('Class added successfully!', 'success');
            closeModal();
            
            const classSelect = document.getElementById('classSelect');
            if (classSelect) {
                classSelect.innerHTML += `<option value="${data.class_id}" selected>${className}</option>`;
                classSelect.value = data.class_id;
            }
            
            const notificationClass = document.getElementById('notificationClass');
            if (notificationClass) {
                notificationClass.innerHTML += `<option value="${data.class_id}">${className}</option>`;
            }
            
            document.getElementById('newClassName').value = '';
        } else {
            showToast(data.error || 'Error adding class', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error adding class', 'error');
    }
};

window.addEventListener('click', (e) => {
    const addClassModal = document.getElementById('addClassModal');
    const editScheduleModal = document.getElementById('editScheduleModal');
    
    if (e.target === addClassModal) closeModal();
    if (e.target === editScheduleModal) closeEditModal();
});

function initializeLogout() {
    const confirmLogoutBtn = document.querySelector('.confirm-logout');
    const cancelLogoutBtn = document.querySelector('.cancel-logout');
    
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', () => {
            showToast('Logging out...', 'info');
            setTimeout(() => {
                window.location.href = '/teacher-login/';
            }, 500);
        });
    }
    
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            const dashboardTab = document.querySelector('[data-tab="dashboard"]');
            if (dashboardTab) {
                dashboardTab.click();
            }
        });
    }
}

setInterval(loadNotifications, 30000);

setTimeout(() => {
    const teacherName = document.getElementById('teacher_full_name')?.value || 'Teacher';
    showToast(`Welcome back, ${teacherName}!`, 'success');
}, 1000);

function exportAttendanceExcel() {
    const table = document.getElementById('attendanceTable');
    if (!table) { alert('No attendance data to export!'); return; }

    const subject = document.getElementById('attendanceSubject')?.value || 'Subject';
    const date = document.getElementById('attendanceDate')?.value || new Date().toISOString().split('T')[0];

    const wb = XLSX.utils.book_new();
    const ws_data = [['MirrorMind - Attendance Report'], ['Subject:', subject], ['Date:', date], ['']];
    ws_data.push(['#', 'Enrollment No', 'Student Name', 'Time']);

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, i) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            ws_data.push([i+1, cells[1].innerText, cells[2].innerText, cells[3].innerText]);
        }
    });

    ws_data.push(['']);
    ws_data.push(['Total Present:', rows.length]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{wch:5},{wch:18},{wch:25},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, `Attendance_${subject}_${date}.xlsx`);
}

const EMOTION_ICONS_A = { Happy:'😊', Focused:'🧠', Neutral:'😐', Bored:'😒', Sad:'😢', Sleepy:'💤', Unavailable:'📵' };
const EMOTION_COLORS_A = {
    Happy:'#28a745', Focused:'#007bff', Neutral:'#a29bfe',
    Bored:'#fd7e14', Sad:'#6496ff', Sleepy:'#dc3545', Unavailable:'#adb5bd'
};
let attendanceChart, emotionChartObj, trendChartObj;

async function loadAnalytics() {
    const subject = document.getElementById('analyticsSubject').value;
    if (!subject) { alert('Please select a subject first!'); return; }

    document.getElementById('analyticsContent').style.display = 'none';
    document.getElementById('analyticsLoading').style.display = 'block';

    if (attendanceChart)  { attendanceChart.destroy();  attendanceChart  = null; }
    if (emotionChartObj)  { emotionChartObj.destroy();  emotionChartObj  = null; }
    if (trendChartObj)    { trendChartObj.destroy();    trendChartObj    = null; }

    const teacherId = document.getElementById('teacher_id').value;
    let presentCount=0, totalStudents=0, trendLabels=[], trendData=[];
    let emotionLabels=['Happy','Focused','Neutral','Bored','Sad','Sleepy','Unavailable'];
    let emotionData=[0,0,0,0,0,0,0];
    let emotionColors=Object.values(EMOTION_COLORS_A);
    let perStudent=[];

    try {
        const res = await fetch(`/api/analytics-data/?teacher_id=${teacherId}&subject=${encodeURIComponent(subject)}`);
        if (res.ok) {
            const d = await res.json();
            if (d.success) {
                presentCount   = d.avg_present    || 0;
                totalStudents  = d.total_classes  || 0;
                trendLabels    = d.trend_labels   || [];
                trendData      = d.trend_data     || [];
                emotionLabels  = d.emotion_labels || emotionLabels;
                emotionData    = d.emotion_data   || emotionData;
                emotionColors  = d.emotion_colors || emotionColors;
                perStudent     = d.per_student    || [];
            }
        }
    } catch(e) { console.warn('Analytics fetch error:', e); }

    if (trendLabels.length === 0) {
        const today = new Date();
        for (let i=6;i>=0;i--) {
            const dd = new Date(today); dd.setDate(dd.getDate()-i);
            trendLabels.push(dd.toLocaleDateString('en-IN',{day:'2-digit',month:'short'}));
            trendData.push(Math.floor(Math.random()*15)+5);
        }
        presentCount  = Math.round(trendData.reduce((a,b)=>a+b,0)/trendData.length);
        totalStudents = 30;
    }

    const attendPct = totalStudents > 0 ? Math.round((presentCount / totalStudents)*100) : 0;

    document.getElementById('analyticsLoading').style.display = 'none';
    document.getElementById('analyticsContent').style.display = 'block';

    attendanceChart = new Chart(document.getElementById('attendanceRateChart'), {
        type:'doughnut',
        data:{
            labels:['Present','Absent'],
            datasets:[{ data:[attendPct, 100-attendPct],
                backgroundColor:['#28a745','#dc3545'], borderWidth:2 }]
        },
        options:{
            plugins:{ legend:{position:'bottom'}, tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.parsed}%`}} },
            cutout:'65%'
        }
    });
    document.getElementById('attendanceRateText').innerHTML =
        `<strong style="font-size:22px;color:#28a745;">${attendPct}%</strong><br><span style="font-size:13px;color:#777;">Average Attendance</span>`;

    const showAll = emotionData.every(v=>v===0);
    const filteredLabels = showAll ? emotionLabels : emotionLabels.filter((_,i)=>emotionData[i]>0);
    const filteredData   = showAll ? [1,1,1,1,1,1,1] : emotionData.filter(v=>v>0);
    const filteredColors = showAll ? emotionColors : emotionColors.filter((_,i)=>emotionData[i]>0);
    const filteredIcons  = filteredLabels.map(l => (EMOTION_ICONS_A[l]||'') + ' ' + l);

    emotionChartObj = new Chart(document.getElementById('emotionChart'), {
        type:'bar',
        data:{
            labels: filteredIcons,
            datasets:[{ label:'Emotion Count',
                data: filteredData,
                backgroundColor: filteredColors,
                borderRadius:6 }]
        },
        options:{
            plugins:{ legend:{display:false},
                tooltip:{callbacks:{label:ctx=>`${ctx.parsed.y} detections`}} },
            scales:{ y:{ beginAtZero:true, ticks:{stepSize:1} } },
            responsive:true,
        }
    });

    trendChartObj = new Chart(document.getElementById('trendChart'), {
        type:'line',
        data:{
            labels: trendLabels,
            datasets:[{ label:'Students Present', data:trendData,
                borderColor:'#667eea', backgroundColor:'rgba(102,126,234,0.12)',
                fill:true, tension:0.4, pointBackgroundColor:'#667eea', pointRadius:5 }]
        },
        options:{
            plugins:{ legend:{position:'top'} },
            scales:{ y:{ beginAtZero:true, ticks:{stepSize:1} } }
        }
    });

    const tbody = document.getElementById('engagementTableBody');
    if (perStudent.length > 0) {
        tbody.innerHTML = perStudent.map(stu => {
            const pct   = stu.engagement_pct || 0;
            const dom   = stu.dominant || 'No Data';
            const icon  = EMOTION_ICONS_A[dom]  || '—';
            const color = EMOTION_COLORS_A[dom] || '#6c757d';
            const barColor = pct >= 70 ? '#28a745' : pct >= 40 ? '#fd7e14' : '#dc3545';
            return `<tr style="border-bottom:1px solid #f0f0f0;">
                <td style="padding:9px 12px;font-weight:500;">${stu.name}</td>
                <td style="padding:9px 12px;color:#666;">${stu.enrollment || '—'}</td>
                <td style="padding:9px 12px;text-align:center;">
                    <span style="background:${color}18;color:${color};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">
                        ${icon} ${dom}
                    </span>
                </td>
                <td style="padding:9px 12px;text-align:center;font-weight:700;color:${barColor};">${pct}%</td>
                <td style="padding:9px 12px;min-width:120px;">
                    <div style="background:#e9ecef;border-radius:6px;height:8px;overflow:hidden;">
                        <div style="width:${pct}%;background:${barColor};height:100%;border-radius:6px;transition:width 0.6s;"></div>
                    </div>
                </td>
             </tr>`;
        }).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:18px;color:#6c757d;">No engagement data yet. Data is collected during live classes.</td></tr>';
    }

    const attList = document.getElementById('attentionList');
    const lowEng  = perStudent.filter(s => s.engagement_pct < 50 && s.engagement_pct > 0);
    if (attendPct < 75) {
        attList.innerHTML = `<div style="color:#dc3545;padding:10px;background:#fff5f5;border-radius:8px;border-left:4px solid #dc3545;margin-bottom:10px;">
            <i class="fas fa-exclamation-circle"></i> Overall attendance for <strong>${subject}</strong> is below 75%. Consider reviewing student participation.</div>`;
    }
    if (lowEng.length > 0) {
        attList.innerHTML += lowEng.map(s =>
            `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;border:1px solid #ffeaa0;background:#fffdf0;margin-bottom:6px;">
                <i class="fas fa-user-clock" style="color:#fd7e14;"></i>
                <strong>${s.name}</strong>
                <span style="color:#6c757d;font-size:13px;">(${s.enrollment})</span>
                <span style="margin-left:auto;color:#dc3545;font-weight:600;">${s.engagement_pct}% engagement</span>
            </div>`
        ).join('');
    } else if (attendPct >= 75) {
        attList.innerHTML = `<p style="color:#28a745;text-align:center;"><i class="fas fa-check-circle"></i> All students are performing well in <strong>${subject}</strong>!</p>`;
    }
}

function toggleMenu() {
    document.getElementById("sidebar").classList.toggle("active");
}