AOS.init({
    duration: 1000,
    once: true,
    mirror: false,
    offset: 40,
});

const dustDiv = document.getElementById('dust');
for (let i = 0; i < 40; i++) {
    let s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = Math.random() * 10 + 's';
    s.style.animationDuration = (16 + Math.random() * 20) + 's';
    dustDiv.appendChild(s);
}

const navbar = document.getElementById('mainNavbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

const track = document.getElementById('carouselTrack');
const cards = Array.from(track.children);
let centerIndex = 0;

function applyPositions() {
    const total = cards.length;
    cards.forEach((card, idx) => {
        card.classList.remove('center', 'left', 'right', 'far-left', 'far-right');
        if (idx === centerIndex) card.classList.add('center');
        else if (idx === (centerIndex - 1 + total) % total) card.classList.add('left');
        else if (idx === (centerIndex + 1) % total) card.classList.add('right');
        else if (idx === (centerIndex - 2 + total) % total) card.classList.add('far-left');
        else if (idx === (centerIndex + 2) % total) card.classList.add('far-right');
    });
}
applyPositions();

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    centerIndex = (centerIndex + 1) % cards.length;
    applyPositions();
});

prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    centerIndex = (centerIndex - 1 + cards.length) % cards.length;
    applyPositions();
});

let autoRotateInterval;
setTimeout(() => {
    autoRotateInterval = setInterval(() => {
        centerIndex = (centerIndex + 1) % cards.length;
        applyPositions();
    }, 5000);
}, 10000);