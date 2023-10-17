function displayQR(e) {       
  e.preventDefault();
  window.location.href="/qr?name=" + encodeURIComponent(document.getElementById("nameInput").value);
}
