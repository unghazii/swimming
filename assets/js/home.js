// Logic halaman Home
document.addEventListener('DOMContentLoaded', () => {
  Utils.mountNavbar('home');
  Utils.mountFooter();

  // Smooth scroll untuk anchor link
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Update kontak WhatsApp link
  const waLinks = document.querySelectorAll('[data-wa]');
  waLinks.forEach(a => {
    a.href = `https://wa.me/${CONFIG.CONTACT.whatsapp}`;
  });
});
