Generate a hashed password for the admin password:
```bash
echo -n "<password>" | argon2 saltItWithSalt -l 32 -e
```
