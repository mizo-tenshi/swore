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
