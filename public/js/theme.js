// Applies the saved theme (light/dark) as early as possible, on every
// page — not just index.html. This file must be loaded synchronously
// (no `defer`/`async`) near the top of <head>, before the CSS/body
// render, so the page never flashes the wrong theme.
//
// Previously this logic lived only inside js/script.js's
// initThemeToggle(), and that function returned immediately if it
// couldn't find the #modeToggle button (which only exists on
// index.html). That meant every other page (course.html, profile.html,
// join.html, etc.) always ignored the saved preference and rendered in
// the default dark theme, even after the user switched to light mode
// on the homepage.
(function () {
  try {
    var saved = localStorage.getItem('club-theme');
    if (saved === 'light') {
      document.documentElement.classList.add('theme-light');
    }
  } catch (error) {
    // localStorage can throw in some privacy modes; default theme is fine.
  }
})();
