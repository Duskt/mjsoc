export default function displayQR(e: Event) {
    e.preventDefault();
    let nameInput = document.getElementById('nameInput') as HTMLInputElement;
    window.location.href = '/qr?name=' + encodeURIComponent(nameInput.value);
}
