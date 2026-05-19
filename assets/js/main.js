const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('on'); }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.r').forEach((el) => {
  const siblings = [...el.parentElement.querySelectorAll('.r')];
  el.style.transitionDelay = (siblings.indexOf(el) * 0.12) + 's';
  io.observe(el);
});
