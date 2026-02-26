# Install postgre

In this [url](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) choose the good version

Go to the version for me i've installed the version 18 so the bin folder is in : C:\Program Files\PostgreSQL\18\bin
Add this folder to system path.
Be carefull with the password you have to type it during installation (if you want to reset refer to this link : [url](https://www.youtube.com/watch?v=_LzhkD5hYGs&t=190s))

# Init db and create db postgres 18

Official documentiation is [here](https://www.postgresql.org/docs/18/)
Your bdd path with configuration are here : C:\Program Files\PostgreSQL\18\data by default 

create databbase

```sh
createdb test
```

Create table with RLS
```sh
psql -U postgres -d test -f all.sql
```

Connect to bdd
```sh
psql -U postgres -d test
```

# Generate key for jwt

If you don't have openssl [here](https://slproweb.com/products/Win32OpenSSL.html) to install it

```sh
openssl rand -base64 32
```

# Rename .env-test file .env file

Add everything from postgre and a key for JWT_SECRET_KEY

# Launch app

replace signIn by signUp in file index ![index][./img/screen1.png]

```sh
npm i
```
```sh
npm run dev
```

The app will run on port 3000

# What kind of security is there

- Last version used to prevent old CVE
- CSP with helmet prevent xss
- Cors with cors prevent xss and ddos
- Cookies securised prevent xss
- Jwt token implemented
- CSFR not fully handled
- Password hashed bcrypt salt used 12
- Request protected with express-validator prevent sql injection
- RLS implemented in postgres
- Constraints added in postgres