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
function setLang(lang) {
  document.querySelectorAll('[data-en]').forEach(el => {
    if (lang === 'en') {
      if (!el.dataset.ja) el.dataset.ja = el.innerHTML;
      el.innerHTML = el.dataset.en;
    } else {
      if (el.dataset.ja) el.innerHTML = el.dataset.ja;
    }
  });
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = lang === 'en' ? 'JA' : 'EN';
  localStorage.setItem('swore-lang', lang);
}

const langBtn = document.getElementById('lang-toggle');
if (langBtn) {
  langBtn.addEventListener('click', () => {
    const current = localStorage.getItem('swore-lang') || 'ja';
    setLang(current === 'en' ? 'ja' : 'en');
  });
}

const savedLang = localStorage.getItem('swore-lang');
if (savedLang === 'en') setLang('en');
