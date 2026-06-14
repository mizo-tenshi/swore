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
  const siblings = [...el.parentElement.querySelectorAll('.fade-in')];
  el.style.transitionDelay = (siblings.indexOf(el) * 0.18) + 's';
  observer.observe(el);
});
