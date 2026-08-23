(function () {
  'use strict';

  // Ano no footer
  document.getElementById('ano').textContent = new Date().getFullYear();

  // Menu mobile (toggle)
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-label',
        navLinks.classList.contains('open') ? 'Fechar menu' : 'Abrir menu'
      );
    });
  }

  // Formulário de contato (simulação de envio)
  const form = document.getElementById('formContato');
  const feedback = document.getElementById('formFeedback');

  if (form && feedback) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value.trim();
      const mensagem = document.getElementById('mensagem').value.trim();

      if (!nome || !email || !mensagem) {
        feedback.textContent = 'Preencha todos os campos.';
        feedback.className = 'form-feedback error';
        return;
      }

      feedback.textContent = 'Enviando...';
      feedback.className = 'form-feedback';

      // Simula envio (em um projeto real, faria uma requisição ao backend)
      setTimeout(function () {
        feedback.textContent = 'Mensagem enviada! Entraremos em contato em breve.';
        feedback.className = 'form-feedback success';
        form.reset();
      }, 1200);
    });
  }

  // Scroll suave já está via CSS (scroll-behavior: smooth)
  // Opcional: destacar link ativo ao rolar
  const sections = document.querySelectorAll('section[id]');

  function highlightNav() {
    const scrollY = window.scrollY;

    sections.forEach(function (section) {
      const id = section.getAttribute('id');
      const top = section.offsetTop - 100;
      const height = section.offsetHeight;

      if (scrollY >= top && scrollY < top + height) {
        document.querySelectorAll('.nav-links a').forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNav);
  highlightNav();
})();
