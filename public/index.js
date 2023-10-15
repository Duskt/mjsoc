function displayQR(e) {       
  e.preventDefault();
  window.location.href="http://localhost:5654?name=" + document.getElementById("nameInput").value;
}
