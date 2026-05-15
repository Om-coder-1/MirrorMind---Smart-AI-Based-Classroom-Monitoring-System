(function() {
  var particlesEl = document.getElementById('particles');
  if (particlesEl) {
    for (var i = 0; i < 30; i++) {
      var p = document.createElement('div');
      var size = Math.floor(Math.random() * 8) + 2;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.position = 'absolute';
      p.style.borderRadius = '50%';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 110 + '%';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.animationDuration = (Math.floor(Math.random() * 15) + 15) + 's';
      p.style.background = 'rgba(150, 180, 240, ' + (0.05 + Math.random() * 0.1) + ')';
      p.style.pointerEvents = 'none';
      p.style.animation = 'floatParticle 20s infinite linear';
      particlesEl.appendChild(p);
    }
  }

  var featureItems = document.querySelectorAll('.feature-list li');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  
  for (var i = 0; i < featureItems.length; i++) {
    observer.observe(featureItems[i]);
  }

  var logo = document.getElementById("logo-animation");
  var titleEl = document.getElementById("typewriter-title");
  var subtitleEl = document.getElementById("typewriter-subtitle");

  if (titleEl) {
    titleEl.style.visibility = "hidden";
    titleEl.style.minHeight = "5rem";
  }
  if (subtitleEl) {
    subtitleEl.style.visibility = "hidden";
    subtitleEl.style.minHeight = "3rem";
  }

  function animateLogo() {
    if (!logo) return;
    logo.style.transform = "scale(3)";
    logo.style.opacity = "0";
    logo.style.transition = "none";
    logo.offsetWidth;
    logo.style.transition = "transform 1000ms ease-out, opacity 1000ms ease-out";
    logo.style.transform = "scale(1)";
    logo.style.opacity = "1";
    setTimeout(function() {
      startTypewriterEffect();
    }, 1000);
  }

  function startTypewriterEffect() {
    var titleText = "MirrorMind";
    var subtitleText = "Brighter Mind, Smarter Learning";
    
    if (titleEl) {
      titleEl.style.visibility = "visible";
      titleEl.textContent = "";
    }
    if (subtitleEl) {
      subtitleEl.style.visibility = "visible";
      subtitleEl.textContent = "";
    }
    
    var titleIndex = 0;
    
    function typeTitle() {
      if (!titleEl) return;
      if (titleIndex < titleText.length) {
        titleEl.textContent += titleText.charAt(titleIndex);
        titleIndex++;
        setTimeout(typeTitle, 120);
      } else {
        if (subtitleEl) {
          var subIndex = 0;
          function typeSubtitle() {
            if (subIndex < subtitleText.length) {
              subtitleEl.textContent += subtitleText.charAt(subIndex);
              subIndex++;
              setTimeout(typeSubtitle, 50);
            }
          }
          typeSubtitle();
        }
      }
    }
    
    typeTitle();
  }

  function init() {
    animateLogo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();