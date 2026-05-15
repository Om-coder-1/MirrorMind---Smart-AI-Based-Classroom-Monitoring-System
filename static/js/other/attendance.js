const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const result = document.getElementById('result');
const cameraStatus = document.getElementById('cameraStatus');
const cameraBox = document.getElementById('cameraBox');
const attendanceBtn = document.getElementById('attendanceBtn');

const subject = document.getElementById('subjectInput').value;
let className = document.getElementById('classInput').value.toUpperCase();

let processing = false;
let cameraReady = false;
let stream = null;

function showToast(msg, type) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('Camera API not supported', 'error');
        attendanceBtn.disabled = true;
        return;
    }
    
    cameraStatus.innerHTML = '⏳ Accessing camera...';
    navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
    }).then(s => {
        stream = s;
        video.srcObject = stream;
        cameraReady = true;
        cameraStatus.innerHTML = '📷 Camera ready';
        cameraBox.classList.add('ready');
        attendanceBtn.disabled = false;
        showToast('Camera ready for attendance', 'success');
    }).catch(err => {
        cameraStatus.innerHTML = '❌ Camera access denied';
        attendanceBtn.disabled = true;
        showToast('Camera access denied', 'error');
    });
}

function handleError(msg) {
    result.className = 'result-box error';
    result.innerHTML = `<div class="result-text"><i class="fas fa-times-circle"></i> <span>❌ ${msg}</span></div>`;
    showToast(msg, 'error');
}

function sendAttendance() {
    const imageData = canvas.toDataURL('image/jpeg');
    const scheduleId = document.getElementById('scheduleInput').value || new URLSearchParams(window.location.search).get('schedule') || '';
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/attendance/mark/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'image=' + encodeURIComponent(imageData) + 
              '&subject=' + encodeURIComponent(subject) + 
              '&class=' + encodeURIComponent(className) + 
              '&schedule_id=' + encodeURIComponent(scheduleId)
    }).then(response => response.json()).then(data => {
        if (data.status === 'success') {
            result.className = 'result-box success';
            result.innerHTML = `<div class="result-text"><i class="fas fa-check-circle"></i> <span>✅ ${data.name} (${data.enrollment}) marked @ ${data.time}</span></div>`;
            showToast('Attendance marked! Joining class...', 'success');
            const sid = document.getElementById('scheduleInput') ? document.getElementById('scheduleInput').value : new URLSearchParams(window.location.search).get('schedule');
            if (sid) {
                setTimeout(() => {
                    window.location.href = `/live-room/?schedule=${sid}&role=student`;
                }, 2000);
            }
        } else if (data.status === 'already_marked') {
            result.className = 'result-box warning';
            result.innerHTML = '<div class="result-text"><i class="fas fa-exclamation-triangle"></i> <span>⚠ Attendance already marked</span></div>';
            showToast('Already marked! Joining class...', 'warning');
            const sid = document.getElementById('scheduleInput') ? document.getElementById('scheduleInput').value : new URLSearchParams(window.location.search).get('schedule');
            if (sid) {
                setTimeout(() => {
                    window.location.href = `/live-room/?schedule=${sid}&role=student`;
                }, 2000);
            }
        } else if (data.status === 'no_face') {
            handleError('Face not detected. Look at camera.');
        } else if (data.status === 'no_training_data') {
            handleError('No enrolled students found.');
        } else if (data.status === 'image_error') {
            handleError('Image processing failed.');
        } else if (data.status === 'unknown') {
            handleError('Face not recognized.');
        } else {
            handleError('Unexpected server response.');
        }
    }).catch(error => {
        handleError('Network error. Try again.');
    }).finally(() => {
        processing = false;
        attendanceBtn.disabled = false;
    });
}

function takeAttendance() {
    if (processing) return;
    if (!cameraReady) {
        showToast('Camera not ready', 'error');
        return;
    }
    
    processing = true;
    attendanceBtn.disabled = true;
    
    result.className = 'result-box processing';
    result.innerHTML = '<div class="result-text"><i class="fas fa-spinner fa-spin"></i> <span>Processing face recognition...</span></div>';
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    sendAttendance();
}

attendanceBtn.addEventListener('click', function(e) {
    e.preventDefault();
    takeAttendance();
});

document.addEventListener('DOMContentLoaded', () => {
    startCamera();
    window.addEventListener('beforeunload', () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
    });
});