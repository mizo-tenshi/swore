/* ── Scroll fade-in ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 0.1 + 's';
  observer.observe(el);
});

/* ── Mobile nav ── */
const burger  = document.getElementById('nav-burger');
const headerNav = document.getElementById('header-nav');

if (burger && headerNav) {
  burger.addEventListener('click', () => {
    const isOpen = headerNav.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  headerNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      headerNav.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── Language i18n ── */
let currentLang = localStorage.getItem('swore-lang') || 'ja';

function applyLang(lang) {
  document.documentElement.lang = lang === 'en' ? 'en' : 'ja';

  document.querySelectorAll('[data-en]').forEach(el => {
    if (lang === 'en') {
      if (!el.dataset.ja) el.dataset.ja = el.innerHTML;
      el.innerHTML = el.dataset.en;
    } else {
      if (el.dataset.ja) el.innerHTML = el.dataset.ja;
    }
  });

  document.querySelectorAll('option[data-en]').forEach(opt => {
    if (lang === 'en') {
      if (!opt.dataset.ja) opt.dataset.ja = opt.textContent;
      opt.textContent = opt.dataset.en;
    } else {
      if (opt.dataset.ja) opt.textContent = opt.dataset.ja;
    }
  });

  const optJa = document.getElementById('opt-ja');
  const optEn = document.getElementById('opt-en');
  if (optJa) optJa.classList.toggle('active', lang === 'ja');
  if (optEn) optEn.classList.toggle('active', lang === 'en');

  localStorage.setItem('swore-lang', lang);
  currentLang = lang;
}

const langBtn = document.getElementById('lang-toggle');
if (langBtn) {
  langBtn.addEventListener('click', () => {
    applyLang(currentLang === 'en' ? 'ja' : 'en');
  });
}

if (currentLang === 'en') applyLang('en');

/* ── Waiting list form ── */
const form       = document.getElementById('wl-form');
const formBody   = document.getElementById('wl-form-body');
const formSuccess = document.getElementById('form-success');
const formFail   = document.getElementById('form-fail');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = form.querySelector('[type="submit"]');
    const origText = btn.textContent;
    btn.textContent = currentLang === 'en' ? 'Submitting…' : '送信中…';
    btn.disabled = true;
    formFail.hidden = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        formBody.hidden = true;
        formSuccess.hidden = false;
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        formFail.hidden = false;
        btn.textContent = origText;
        btn.disabled = false;
      }
    } catch {
      formFail.hidden = false;
      btn.textContent = origText;
      btn.disabled = false;
    }
  });
}

function validateForm() {
  let valid = true;

  const name = document.getElementById('f-name');
  const errName = document.getElementById('err-name');
  if (name && name.value.trim() === '') {
    showErr(name, errName);
    valid = false;
  } else {
    hideErr(name, errName);
  }

  const email = document.getElementById('f-email');
  const errEmail = document.getElementById('err-email');
  if (email && !isValidEmail(email.value.trim())) {
    showErr(email, errEmail);
    valid = false;
  } else {
    hideErr(email, errEmail);
  }

  const country = document.getElementById('f-country');
  const errCountry = document.getElementById('err-country');
  if (country && country.value === '') {
    showErr(country, errCountry);
    valid = false;
  } else {
    hideErr(country, errCountry);
  }

  return valid;
}

function showErr(input, errEl) {
  input.closest('.form-field').classList.add('has-error');
  if (errEl) errEl.hidden = false;
}

function hideErr(input, errEl) {
  if (input) input.closest('.form-field').classList.remove('has-error');
  if (errEl) errEl.hidden = true;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* Clear error on input */
document.querySelectorAll('.form-input').forEach(input => {
  input.addEventListener('input', () => {
    const field = input.closest('.form-field');
    if (field) field.classList.remove('has-error');
    const errId = input.id.replace('f-', 'err-');
    const errEl = document.getElementById(errId);
    if (errEl) errEl.hidden = true;
  });
});
