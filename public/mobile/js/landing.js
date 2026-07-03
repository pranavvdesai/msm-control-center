const DASHBOARD_URL = "/dashboard";
const LOGIN_URL = "/login";
const REPLAY_SESSION_KEY = "msm-replay-birthday";

const enterBtn = document.getElementById("enterBtn");
const loader = document.getElementById("loader");

function rememberReplayFlag() {
  if (!window.location.search.includes("replay-birthday=1")) return;
  try {
    sessionStorage.setItem(REPLAY_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

function appUrl(path) {
  rememberReplayFlag();
  const qs = window.location.search;
  return qs ? `${path}${qs}` : path;
}

async function isLoggedIn() {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.user;
  } catch {
    return false;
  }
}

function showLoader() {
  if (loader) loader.hidden = false;
}

async function goToApp() {
  showLoader();
  if (enterBtn) enterBtn.disabled = true;
  const loggedIn = await isLoggedIn();
  window.location.href = loggedIn ? appUrl(DASHBOARD_URL) : appUrl(LOGIN_URL);
}

rememberReplayFlag();

enterBtn?.addEventListener("click", () => {
  setTimeout(goToApp, 350);
});

// Already logged in? Skip login and open dashboard directly.
isLoggedIn().then((loggedIn) => {
  if (loggedIn) {
    showLoader();
    window.location.href = appUrl(DASHBOARD_URL);
  }
});

// Easter egg: tap logo area 3x for haptic-style flash
let taps = 0;
document.querySelector(".logo-ring")?.addEventListener("click", () => {
  taps += 1;
  if (taps >= 3) {
    document.body.style.filter = "hue-rotate(90deg)";
    setTimeout(() => {
      document.body.style.filter = "";
      taps = 0;
    }, 400);
  }
});
