// AOS initialization
AOS.init({
    duration: 1000,
    once: true,
    mirror: false,
    offset: 40,
});

// Floating dust particles
const dustDiv = document.getElementById('dust');
for (let i = 0; i < 40; i++) {
    let s = document.createElement('span');
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = Math.random() * 10 + 's';
    s.style.animationDuration = (16 + Math.random() * 20) + 's';
    dustDiv.appendChild(s);
}

// Navbar scroll effect
const navbar = document.getElementById('mainNavbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

// Smooth scroll for nav links
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function (e) {
        if (this.getAttribute('href').includes('#')) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// Form submission
const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Show success message
    successMessage.classList.add('show');
    
    // Reset form
    contactForm.reset();
    
    // Hide message after 5 seconds
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 5000);
});

// Search functionality
const searchInput = document.querySelector('.search-container input');
searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Simple search highlighting in FAQ
    document.querySelectorAll('.faq-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm) && searchTerm.length > 2) {
            item.style.borderColor = '#0cf';
            item.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.3)';
        } else {
            item.style.borderColor = 'rgba(0, 200, 255, 0.2)';
            item.style.boxShadow = 'none';
        }
    });
});

// Quick help card clicks
document.querySelectorAll('.quick-help-card').forEach((card, index) => {
    card.addEventListener('click', () => {
        const categories = ['getting-started', 'attendance', 'analytics', 'privacy'];
        window.location.href = `#${categories[index]}`;
    });
});

// Live chat function
function startChat() {
    alert('Live chat would open here. Our support team is ready to help!');
}

// Make function globally available
window.startChat = startChat;