/* Tengsheng International — progressive enhancement only.
   The site is fully readable without JavaScript. */

(function () {
  'use strict';

  var header = document.querySelector('[data-header]');

  /* ------------------------------------------------------------------ header */
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* --------------------------------------------------------------- mobile nav */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setNav(open) {
    if (!header || !toggle) return;
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-locked', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setNav(!header.classList.contains('nav-open'));
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('nav-open')) {
        setNav(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!header.classList.contains('nav-open')) return;
      if (!header.contains(event.target)) setNav(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && header.classList.contains('nav-open')) setNav(false);
    });
  }

  /* ------------------------------------------------------------- scroll reveal */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && reveals.length && !reduceMotion) {
    reveals.forEach(function (el) {
      el.classList.add('will-reveal');
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var siblings = Array.prototype.slice.call(el.parentElement ? el.parentElement.children : []);
          var index = siblings.indexOf(el);
          el.style.transitionDelay = Math.min(index, 5) * 55 + 'ms';
          el.classList.add('is-visible');
          observer.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* --------------------------------------------------------------- inventory */
  var filterPanel = document.querySelector('[data-filters]');

  if (filterPanel) {
    var grid = document.querySelector('[data-grid]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-grid] .v-card'));
    var empty = document.querySelector('[data-empty]');
    var countEl = document.querySelector('[data-count]');
    var searchInput = filterPanel.querySelector('[data-search-input]');
    var selects = Array.prototype.slice.call(filterPanel.querySelectorAll('select[data-filter]'));
    var chips = Array.prototype.slice.call(filterPanel.querySelectorAll('.chip[data-filter]'));
    var resets = Array.prototype.slice.call(document.querySelectorAll('[data-reset]'));
    var state = { brand: 'all', condition: 'all', body: 'all', fuel: 'all', q: '' };

    function apply() {
      var shown = 0;
      cards.forEach(function (card) {
        var ok =
          (state.brand === 'all' || card.dataset.brand === state.brand) &&
          (state.condition === 'all' || card.dataset.condition === state.condition) &&
          (state.body === 'all' || card.dataset.body === state.body) &&
          (state.fuel === 'all' || card.dataset.fuel === state.fuel) &&
          (!state.q || (card.dataset.search || '').indexOf(state.q) !== -1);
        card.hidden = !ok;
        if (ok) shown += 1;
      });
      if (countEl) countEl.textContent = String(shown);
      if (empty) empty.hidden = shown !== 0;
      if (grid) grid.hidden = shown === 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) {
          c.classList.toggle('is-active', c === chip);
        });
        state[chip.dataset.filter] = chip.dataset.value;
        apply();
      });
    });

    selects.forEach(function (select) {
      select.addEventListener('change', function () {
        state[select.dataset.filter] = select.value;
        apply();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.q = searchInput.value.trim().toLowerCase();
        apply();
      });
    }

    resets.forEach(function (button) {
      button.addEventListener('click', function () {
        state = { brand: 'all', condition: 'all', body: 'all', fuel: 'all', q: '' };
        chips.forEach(function (c) {
          c.classList.toggle('is-active', c.dataset.value === 'all');
        });
        selects.forEach(function (s) {
          s.value = 'all';
        });
        if (searchInput) searchInput.value = '';
        apply();
      });
    });
  }

  /* ----------------------------------------------------------------- gallery */
  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var main = gallery.querySelector('[data-gallery-main]');
    var video = gallery.querySelector('[data-gallery-video]');
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-thumb'));

    function showImage(thumb) {
      if (!main) return;
      if (video) {
        video.pause();
        video.hidden = true;
        video.removeAttribute('src');
        video.load();
      }
      main.hidden = false;
      main.src = thumb.dataset.src;
      if (thumb.dataset.alt) main.alt = thumb.dataset.alt;
    }

    function showVideo(thumb) {
      if (!video) return;
      if (main) main.hidden = true;
      video.hidden = false;
      video.src = thumb.dataset.src;
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        if (thumb.dataset.type === 'video') showVideo(thumb);
        else showImage(thumb);
        thumbs.forEach(function (t) {
          t.classList.toggle('is-active', t === thumb);
        });
      });
    });
  }

  /* ------------------------------------------------------------ inquiry form */
  var form = document.querySelector('[data-inquiry-form]');
  if (form) {
    var status = form.querySelector('[data-form-status]');
    var whatsappNumber = form.dataset.whatsapp || '';

    function field(name) {
      var el = form.elements[name];
      return el ? String(el.value || '').trim() : '';
    }

    function compose() {
      var name = field('name');
      var country = field('country');
      if (!name || !country) {
        if (status) status.textContent = 'Please add your name and destination country so we can quote accurately.';
        (form.elements[name ? 'country' : 'name'] || {}).focus?.();
        return null;
      }
      var vehicle = field('vehicle') || 'General sourcing request';
      var lines = [
        'New vehicle export inquiry — Tengsheng International',
        '',
        'Name: ' + name,
        'Country: ' + country,
        'Email: ' + (field('email') || '—'),
        'WhatsApp / phone: ' + (field('phone') || '—'),
        'Vehicle: ' + vehicle,
        'Destination port / quantity: ' + (field('quantity') || '—'),
        '',
        'Message:',
        field('message') || '—',
      ];
      return {
        subject: 'Vehicle inquiry — ' + vehicle,
        body: lines.join('\n'),
      };
    }

    function send(kind) {
      var data = compose();
      if (!data) return;
      if (status) status.textContent = '';
      if (kind === 'email') {
        window.location.href =
          'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent(data.subject) + '&body=' + encodeURIComponent(data.body);
        if (status) status.textContent = 'Opening your email app…';
        return;
      }
      var number = whatsappNumber || form.dataset.whatsappNumber;
      if (!number) return;
      window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(data.body), '_blank', 'noopener');
      if (status) status.textContent = 'Opening WhatsApp with your inquiry…';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      send('whatsapp');
    });

    Array.prototype.slice.call(form.querySelectorAll('[data-send]')).forEach(function (button) {
      button.addEventListener('click', function () {
        send(button.dataset.send);
      });
    });
  }
})();
