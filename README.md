A simple backend with a hashed password and cookie sessions connected to a Google Sheets API.
Built with Rust.
1. Generate a hashed password for the admin password:
```bash
echo -n "<password>" | argon2 saltItWithSalt -l 32 -e
```
2. Create hmac file with any random characters in
3. Create week.json file:
``{"week":1,"last_set_unix_seconds":1708509377}``
4. Deposit logo file in public/assets/logo.jpg
5. ``cargo run``
 
You may have to install libssl-dev and pkg-config (Ubuntu)
```bash
sudo apt install libssl-dev
sudo apt install pkg-config
```