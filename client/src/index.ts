import displayQR from "./pages/qr.ts";
import tables from "./pages/tables.ts";
import logPage from "./pages/log.ts";
import { SettingsButton } from "./components/settings.ts";

function pageMatches(...options: string[]) {
  // in http://a.b/path we skip 3 slashes
  let path = window.location.href.split("/").slice(3).join("/");
  return options.includes(path);
}

async function setup(data: Promise<MahjongData>) {
  window.MJDATA = await data;
  // the server-side navbar is unmodified by the client except for the settings button
  for (let settingsButton of Array.from(
    document.getElementsByClassName("settings-button"),
  )) {
    settingsButton.replaceWith(new SettingsButton().element);
  }
}

function loadPage(pageRenderer: () => void) {
  let headers: HeadersInit = {
    Accept: "application/json",
  };
  fetch("/data.json", { headers }).then(async (r) => {
    await setup(r.json());
    pageRenderer();
  });
}

function route() {
  let navbar = document.getElementsByTagName("nav")[0]; // TODO
  let navButtons = Array.from(navbar.children).filter((v) =>
    v.className.includes("nav-link"),
  );
  let nav = new Map(navButtons.map((v) => [v.textContent?.toLowerCase(), v]));
  if (pageMatches("tables", "table")) {
    loadPage(tables);
    nav.get("tables")?.classList.add("active");
  } else if (pageMatches("qr")) {
    // just declare it is needed for import
    displayQR;
  } else if (pageMatches("log")) {
    loadPage(logPage);
    nav.get("log")?.classList.add("active");
  }
}

document.addEventListener("DOMContentLoaded", route);
