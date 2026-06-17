// Scroll fade-in
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.fade-in').forEach(el => {
  const isLoss = !!el.closest('.loss-inner');
  const siblings = [...el.parentElement.querySelectorAll('.fade-in')];
  const step = isLoss ? 0.3 : 0.18;
  el.style.transitionDelay = (siblings.indexOf(el) * step) + 's';
  observer.observe(el);
});

// Language toggle
let currentLang = localStorage.getItem('swore-lang') || 'ja';

function applyLang(lang) {
  document.querySelectorAll('[data-en]').forEach(function(el) {
    if (lang === 'en') {
      if (!el.getAttribute('data-ja')) {
        el.setAttribute('data-ja', el.innerHTML);
      }
      el.innerHTML = el.getAttribute('data-en');
    } else {
      var ja = el.getAttribute('data-ja');
      if (ja) el.innerHTML = ja;
    }
  });

  var optJa = document.getElementById('opt-ja');
  var optEn = document.getElementById('opt-en');
  if (optJa) optJa.classList.toggle('active', lang === 'ja');
  if (optEn) optEn.classList.toggle('active', lang === 'en');

  localStorage.setItem('swore-lang', lang);
  currentLang = lang;
}

var langBtn = document.getElementById('lang-toggle');
if (langBtn) {
  langBtn.addEventListener('click', function() {
    applyLang(currentLang === 'en' ? 'ja' : 'en');
  });
}

if (currentLang === 'en') applyLang('en');
