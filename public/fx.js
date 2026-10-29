// ---- Plain JavaScript + DOM: scroll progress bar ----
const bar = document.getElementById('progress');
addEventListener('scroll', () => {
  const h = document.documentElement;
  bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
});

// ---- jQuery: toast (manipulators + effects), used by the React app too ----
window.toast = msg => $('<div class="toast-msg">').text(msg).appendTo('#toasts')
  .hide().fadeIn(300).delay(2200).fadeOut(400, function () { $(this).remove(); });

// animated counters: reads data-to, animates with $.animate
window.countUp = sel => $(sel).each(function () {
  const el = $(this), to = +el.data('to');
  $({ n: 0 }).animate({ n: to }, { duration: 1400, step: n => el.text(Math.floor(n)), complete: () => el.text(to) });
});

$(function () {
  // back-to-top button
  $(window).on('scroll', function () { $('#top').toggleClass('show', $(this).scrollTop() > 400); });
  $('#top').on('click', () => $('html, body').animate({ scrollTop: 0 }, 600));

  // traversing: dim sibling cards when hovering one (delegated, so it works on React-rendered cards)
  $(document)
    .on('mouseenter', '.card-alum', function () { $(this).parent().siblings().stop().fadeTo(200, .5); })
    .on('mouseleave', '.card-alum', function () { $(this).parent().siblings().stop().fadeTo(200, 1); });

  // reading a form field with .val()
  $('#news').on('submit', function (e) {
    e.preventDefault();
    const input = $(this).find('input'), email = input.val().trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Please enter a valid email');
    input.val('');
    toast('Subscribed ' + email + ' ✓');
  });
});
