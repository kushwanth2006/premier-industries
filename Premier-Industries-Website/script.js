  // Smooth-scroll for in-page nav links (fallback for older browsers already covered by CSS)
  document.querySelectorAll('a[href^="#"]').forEach(function(link){
    link.addEventListener('click', function(e){
      var id = this.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  // Product card active-state toggle
  document.querySelectorAll('.product-card').forEach(function(card){
    card.addEventListener('click', function(){
      document.querySelectorAll('.product-card').forEach(function(c){ c.classList.remove('active'); });
      card.classList.add('active');
    });
  });



  // ---------------------------------------------------------------
  // Scroll animations — Intersection Observer
  // Reveals .animate / .stagger elements once as they enter the
  // viewport. Stagger delays (150-200ms) are computed automatically
  // per sibling group so card grids cascade in.
  // ---------------------------------------------------------------
  (function initScrollAnimations(){
    var staggerEls = document.querySelectorAll('.stagger');
    var groups = new Map();

    staggerEls.forEach(function(el){
      var parent = el.parentElement;
      if(!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    groups.forEach(function(members){
      members.forEach(function(el, i){
        el.style.transitionDelay = (i * 160) + 'ms';
      });
    });

    var targets = document.querySelectorAll('.animate:not(.capacity-card), .stagger, .tl-reveal');

    if(!('IntersectionObserver' in window)){
      // Fallback: just show everything immediately
      targets.forEach(function(el){ el.classList.add('show'); });
      return;
    }

    var observer = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('show');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    targets.forEach(function(el){ observer.observe(el); });
  })();

  // ---------------------------------------------------------------
  // Mobile nav toggle — hamburger opens/closes the dropdown menu.
  // Closes automatically on link click, outside click, Escape, or
  // if the viewport is resized back up to desktop width.
  // ---------------------------------------------------------------
  (function initMobileNav(){
    var nav = document.querySelector('.site-nav');
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    if(!nav || !toggle || !links) return;

    function closeMenu(){
      nav.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function openMenu(){
      nav.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function(){
      if(nav.classList.contains('nav-open')) closeMenu(); else openMenu();
    });

    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', function(e){
      if(nav.classList.contains('nav-open') && !nav.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function(){
      if(window.innerWidth > 960) closeMenu();
    });
  })();

  // ---------------------------------------------------------------
  // Sticky nav — adds a shadow/condensed state once the page scrolls
  // ---------------------------------------------------------------
  (function initNavScroll(){
    var nav = document.querySelector('.site-nav');
    if(!nav) return;
    function onScroll(){
      if(window.scrollY > 8){
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  })();

  // ---------------------------------------------------------------
  // Count-up numbers — animates any [data-target] element from 0 to
  // its target once it scrolls into view. Supports data-format="indian"
  // for lakh-style comma grouping (e.g. 300000 -> 3,00,000).
  // ---------------------------------------------------------------
  (function initCountUp(){
    var els = document.querySelectorAll('.count-up[data-target]');
    if(!els.length) return;

    function formatIndian(n){
      var s = String(Math.round(n));
      if(s.length <= 3) return s;
      var last3 = s.slice(-3);
      var rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      return rest + ',' + last3;
    }

    function animate(el){
      var target = parseFloat(el.getAttribute('data-target')) || 0;
      var format = el.getAttribute('data-format');
      var duration = 1400;
      var start = null;

      function frame(ts){
        if(start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        var value = target * eased;
        el.textContent = format === 'indian' ? formatIndian(value) : Math.round(value);
        if(progress < 1){
          requestAnimationFrame(frame);
        } else {
          el.textContent = format === 'indian' ? formatIndian(target) : target;
        }
      }
      requestAnimationFrame(frame);
    }

    if(!('IntersectionObserver' in window)){
      els.forEach(animate);
      return;
    }

    var observer = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    els.forEach(function(el){ observer.observe(el); });
  })();

  // ---------------------------------------------------------------
  // Hero "conveyor" — cycles a highlight across the live process
  // chips (Jigging → Degreasing → ... → Drying) to suggest motion
  // through an active production line.
  // ---------------------------------------------------------------
  (function initHeroConveyor(){
    var flow = document.getElementById('hero-flow');
    if(!flow) return;
    var chips = Array.prototype.slice.call(flow.querySelectorAll('.chip'));
    var arrows = Array.prototype.slice.call(flow.querySelectorAll('.flow-arrow'));
    if(!chips.length) return;
    var i = 0;

    function tick(){
      chips.forEach(function(c){ c.classList.remove('chip-active'); });
      arrows.forEach(function(a){ a.classList.remove('arrow-active'); });
      chips[i].classList.add('chip-active');
      if(arrows[i - 1]) arrows[i - 1].classList.add('arrow-active');
      i = (i + 1) % chips.length;
    }
    tick();
    setInterval(tick, 1100);
  })();

  // ---------------------------------------------------------------
  // Process flow section — once visible, loops a highlight through
  // each of the 8 real stages (skips the empty filler cells) to read
  // like current flowing down the line.
  // ---------------------------------------------------------------
  (function initProcessLine(){
    var grid = document.querySelector('.process-grid');
    if(!grid) return;
    var steps = Array.prototype.slice.call(grid.querySelectorAll('.process-step:not(.filler)'));
    if(!steps.length) return;
    var i = 0;
    var intervalId = null;

    function tick(){
      steps.forEach(function(s){ s.classList.remove('step-active'); });
      steps[i].classList.add('step-active');
      i = (i + 1) % steps.length;
    }

    function start(){
      if(intervalId) return;
      tick();
      intervalId = setInterval(tick, 900);
    }

    if(!('IntersectionObserver' in window)){
      start();
      return;
    }

    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting) start();
      });
    }, { threshold: 0.3 });

    observer.observe(grid);
  })();

  // ---------------------------------------------------------------
  // Replaying progress bars — the capacity-card's .bar-fill elements
  // fill from 0% to their target width via CSS transition (driven by
  // the .capacity-card.show rule in style.css). Unlike the generic
  // .animate/.stagger system, this is NOT one-shot: it resets and
  // replays every time the card re-enters the viewport, AND on a
  // full page load/revisit — including browser back/forward restores
  // from bfcache, which don't re-run scripts on their own.
  // ---------------------------------------------------------------
  (function initReplayingBars(){
    var cards = document.querySelectorAll('.capacity-card');
    if(!cards.length) return;

    function reset(card){
      card.classList.remove('show');
      // Reading a layout property forces the browser to apply the
      // width:0 state immediately. Without this, removing and
      // re-adding "show" in the same tick gets batched by the
      // browser and the transition never visibly restarts.
      void card.offsetWidth;
    }

    function play(card){
      reset(card);
      // Wait a couple of frames so the reset actually paints before
      // we re-trigger the transition to the target width.
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          card.classList.add('show');
        });
      });
    }

    function isInViewport(card){
      var rect = card.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }

    if(!('IntersectionObserver' in window)){
      // Fallback: just fill immediately, no replay capability
      cards.forEach(function(card){ card.classList.add('show'); });
      return;
    }

    // Replays every time a card scrolls into/out of view
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          play(entry.target);
        } else {
          reset(entry.target); // re-arm so it's ready to replay next entry
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '0px 0px -60px 0px'
    });

    cards.forEach(function(card){ observer.observe(card); });

    // Handles browser back/forward navigation restored from bfcache,
    // where the page reappears without scripts re-running from scratch.
    window.addEventListener('pageshow', function(e){
      if(e.persisted){
        cards.forEach(function(card){
          if(isInViewport(card)) play(card); else reset(card);
        });
      }
    });
  })();
document.getElementById("enquiry-form").addEventListener("submit", async function(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById("fname").value,
    company: document.getElementById("fcompany").value,
    email: document.getElementById("femail").value,
    phone: document.getElementById("fphone").value,
    component: document.getElementById("fcomponent").value,
    message: document.getElementById("fmsg").value
  };

  try {
    const response = await fetch("https://premier-backend-6d93.onrender.com/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    document.getElementById("form-msg").style.display = "block";
    document.getElementById("enquiry-form").reset();

  } catch (error) {
    console.error("Error:", error);
    alert("Failed to send enquiry. Please try again.");
  }
});

