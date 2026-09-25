const DASHBOARD_URL = "/dashboard";
const LOGIN_URL = "/login";

const enterBtn = document.getElementById("enterBtn");
const loader = document.getElementById("loader");
const APP_ORIGIN = "https://msm-control-center.vercel.app";

async function isLoggedIn() {
  try {
    const res = await fetch(`${APP_ORIGIN}/api/auth/me`, { credentials: "include" });
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
  window.location.href = loggedIn ? `${APP_ORIGIN}${DASHBOARD_URL}` : `${APP_ORIGIN}${LOGIN_URL}`;
}

enterBtn?.addEventListener("click", () => {
  setTimeout(goToApp, 350);
});

isLoggedIn().then((loggedIn) => {
  if (loggedIn) {
    showLoader();
    window.location.href = `${APP_ORIGIN}${DASHBOARD_URL}`;
  }
});

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
