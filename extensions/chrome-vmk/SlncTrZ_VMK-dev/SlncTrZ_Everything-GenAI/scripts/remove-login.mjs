import fs from 'fs';
import { execSync } from 'child_process';

const base = 'H:\\Develop\\SlncTrZ_VMK\\SlncTrZ_VMK-dev\\SlncTrZ_Everything-GenAI';

// 1. sidebar.html - remove login UI
let html = fs.readFileSync(`${base}\\sidebar.html`, 'utf-8');

// Remove login modal overlay
const loginStart = html.indexOf('<!-- Login Modal Overlay -->');
const menuStart = html.indexOf('<!-- User Menu Dropdown -->');
if (loginStart >= 0 && menuStart > loginStart) {
  html = html.slice(0, loginStart) + html.slice(menuStart);
  console.log('Removed login modal');
}

// Remove login button and avatar from header  
const avatarStart = html.indexOf('<!-- User avatar/login -->');
const afterHeaderUser = html.indexOf('</div>', avatarStart);
if (avatarStart >= 0) {
  const headerUserEnd = html.indexOf('</div>', afterHeaderUser + 10);
  const headerClose = html.indexOf('</header>', avatarStart);
  if (headerUserEnd > 0 && headerUserEnd < headerClose) {
    html = html.slice(0, avatarStart) + html.slice(headerUserEnd + 6);
    console.log('Removed login button');
  }
}

// Remove "Not Logged In Footer" section
const notLoggedIn = html.indexOf('<!-- Not Logged In Footer');
if (notLoggedIn >= 0) {
  const freeFooter = html.indexOf('<!-- Free User Footer');
  if (freeFooter > notLoggedIn) {
    html = html.slice(0, notLoggedIn) + html.slice(freeFooter);
    console.log('Removed not-logged-in footer');
  }
}

// Remove "Login Teaser"
const loginTeaser = html.indexOf('<!-- Login Teaser');
if (loginTeaser >= 0) {
  const nextSection = html.indexOf('<div class="usage-stats-free"', loginTeaser);
  const endOfSection = html.indexOf('</div>', nextSection + 20);
  const nextAfter = html.indexOf('</div>', endOfSection + 10);
  if (nextAfter > loginTeaser) {
    html = html.slice(0, loginTeaser) + html.slice(nextAfter + 6);
    console.log('Removed login teaser');
  }
}

// Remove logout from settings menu
const logoutLine = html.indexOf('<!-- Logout');
if (logoutLine >= 0) {
  const btnEnd = html.indexOf('</button>', logoutLine);
  if (btnEnd > logoutLine) {
    html = html.slice(0, logoutLine) + html.slice(btnEnd + 9);
    console.log('Removed logout button');
  }
}

fs.writeFileSync(`${base}\\sidebar.html`, html, 'utf-8');
console.log('\nsidebar.html done');

// 2. settings.html - remove login references
let settings = fs.readFileSync(`${base}\\settings.html`, 'utf-8');
settings = settings.replace(/login|Login/g, '');
fs.writeFileSync(`${base}\\settings.html`, settings, 'utf-8');
console.log('settings.html cleaned');

// 3. Remove login-related i18n keys (optional - just leave them)
console.log('\nAll done');
