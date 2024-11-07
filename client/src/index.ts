import displayQR from "./pages/qr.ts";
import tables from "./pages/tables.ts";
import logPage from "./pages/log.ts";

function path() {
    // in http://a.b/path we skip 3 slashes
    return window.location.href.split("/").slice(3).join("/");
}

if (["tables", "table"].some((x) => x === path())) {
    document.addEventListener("DOMContentLoaded", tables);
} else if (path() === "qr") {
    // just declare it is needed for import
    displayQR;
} else if (path() === "log") {
    document.addEventListener("DOMContentLoaded", logPage);
}
