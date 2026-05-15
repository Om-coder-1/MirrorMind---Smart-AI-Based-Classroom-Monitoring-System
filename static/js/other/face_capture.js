const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const counterText = document.getElementById("counter");
const startBtn = document.getElementById("startBtn");
const toastContainer = document.getElementById("toastContainer");
const progressBar = document.getElementById("progressBar");
const counterContainer = document.querySelector('.counter-container');

const MAX_SAMPLES = 30;   // backend MAX = 30, aligned with frontend
const PROCESSING_DELAY = 700; // ms to wait between frames (respects backend processing time)

let running = false;      // no more interval variable

/* CAMERA */
navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
})
.then(stream => video.srcObject = stream)
.catch(() => showToast("Camera permission denied", "error"));

video.addEventListener("loadedmetadata", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
});

/* TOAST */
function showToast(msg, type="info"){
    const toast = document.createElement("div");
    toast.className = `toast ${type} show`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${msg}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(()=>toast.remove(), 3000);
}

/* START - now uses recursive async loop, not interval */
function startCapture(){
    if(running) return;

    running = true;
    startBtn.disabled = true;
    startBtn.innerHTML = "Capturing Faces...";
    counterText.innerText = "0 / " + MAX_SAMPLES;
    progressBar.style.width = "0%";
    counterContainer.classList.add("active");

    // Start the controlled loop (first frame)
    sendFrame();
}

/* ASYNC SEND FRAME - waits for response before scheduling next */
async function sendFrame(){
    if(!running) return;

    // Capture current frame from video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        const response = await fetch("/process-frame/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({
                student_id: STUDENT_ID,
                image: canvas.toDataURL("image/jpeg", 0.8)   // compressed JPEG
            })
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json();

        let count = data.count || 0;

        // Update UI with current count
        counterText.innerText = count + " / " + MAX_SAMPLES;
        let percent = (count / MAX_SAMPLES) * 100;
        progressBar.style.width = percent + "%";

        // Check if registration is complete
        if(data.done === true){
            stopCapture();
            showToast("Face Registration Completed Successfully!", "success");
            setTimeout(()=>{
                window.location.href = "/student-login/";
            }, 1500);
            return; // Stop the loop
        }

        // 🔥 CRITICAL: Wait for backend to finish processing before next frame
        // This prevents request flooding and "Network error"
        setTimeout(sendFrame, PROCESSING_DELAY);    

    } catch (error){
        console.error("Capture error:", error);
        stopCapture();
        showToast("Network error - please try again", "error");
    }
}

/* STOP - simply stops the loop */
function stopCapture(){
    running = false;
    startBtn.disabled = false;
    startBtn.innerHTML = "Start Face Capture";
    counterContainer.classList.remove("active");
}

/* CSRF */
function getCookie(name){
    let cookieValue = null;
    if(document.cookie){
        document.cookie.split(";").forEach(c=>{
            c = c.trim();
            if(c.startsWith(name+"=")){
                cookieValue = c.substring(name.length+1);
            }
        });
    }
    return cookieValue;
}