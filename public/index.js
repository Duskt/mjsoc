function displayQR(e) {       
  e.preventDefault();
  window.location.href="/qr?name=" + document.getElementById("nameInput").value;
}
