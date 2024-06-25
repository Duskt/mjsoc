import displayQR from "./pages/qr.ts";
import tables from "./pages/tables.ts";

declare global {
    interface Window {
        MJDATA: MahjongData;
    }
}

function path() {
    // in http://a.b/path we skip 3 slashes
    return window.location.href.split('/').slice(3).join('/');
}

if (["tables", "table"].some(x => x == path())) {
    document.addEventListener("DOMContentLoaded", tables);
}