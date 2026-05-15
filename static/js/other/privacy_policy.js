(function () {
  // Intersection Observer for fade-in + scroll spy
  const sections = document.querySelectorAll(".policy-section");
  const navLinks = document.querySelectorAll(".nav-link");
  const navStack = document.getElementById("navStack");

  // Observer for fade-in and active tab
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
        // do not remove visible class
      });

      // determine which section has largest visible area
      let bestSection = null;
      let maxVisibleHeight = 0;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const visibleTop = Math.max(rect.top, 0);
        const visibleBottom = Math.min(rect.bottom, window.innerHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          bestSection = section;
        }
      });

      if (bestSection) {
        const id = bestSection.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.remove("active-tab");
          if (link.dataset.target === id) {
            link.classList.add("active-tab");
            // optionally scroll into view inside nav (vertical)
            if (navStack && window.innerWidth > 900) {
              const container = navStack.parentElement;
              const linkRect = link.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              if (
                linkRect.top < containerRect.top ||
                linkRect.bottom > containerRect.bottom
              ) {
                link.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
              }
            }
          }
        });
      } else {
        // fallback near top
        if (window.scrollY < 300) {
          navLinks.forEach((l) => l.classList.remove("active-tab"));
          document
            .querySelector('.nav-link[data-target="introduction"]')
            .classList.add("active-tab");
        }
      }
    },
    { threshold: 0.2, rootMargin: "0px 0px -10px 0px" },
  );

  sections.forEach((s) => observer.observe(s));

  // smooth scroll on nav click
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // update copyright year
  const footerDiv = document.querySelector(
    ".footer-container div:first-child",
  );
  if (footerDiv) {
    footerDiv.innerHTML = `© ${new Date().getFullYear()} MirrorMind — Academic Smart Classroom Project`;
  }

  // manually trigger observer after load
  window.addEventListener("load", () => {
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top < window.innerHeight)
        s.classList.add("visible");
    });
  });
})();