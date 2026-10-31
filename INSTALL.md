# Hisaab Portal: Install Guide (Roman Urdu)

Ye guide un ke liye hai jo Hisaab Portal ko apne computer par chalana chahte hain.
Programming ka ilm zaroori nahi. Steps ek ek kar ke follow karein.

---

## 1. Kya install karna hai

Sirf **ek** cheez: **Docker Desktop**.

- Download: https://www.docker.com/products/docker-desktop/
- **Windows**: install ke waqt "Use WSL 2" wala option on rehne dein. Install ke baad computer restart karein.
- **Mac / Linux**: normal install kar lein.
- Install ke baad Docker Desktop kholein aur intezar karein jab tak neeche "Engine running" (hara nishan) na aa jaye.

Python, Node ya database alag se install **nahi** karna. Docker ye sab khud kar leta hai.

Computer kam az kam: 8 GB RAM, 10 GB khaali jagah.

---

## 2. Code computer par rakhein

Aap ko ek zip file ya GitHub link mila hoga.

- **Zip**: kisi folder mein extract kar dein, misaal ke taur par `C:\hisaab` (Windows) ya `~/hisaab` (Mac/Linux).
- **GitHub**: `git clone <link> hisaab`

Aage ke tamam commands isi folder ke andar chalani hain. Terminal (Windows par "PowerShell") khol kar likhein:

```bash
cd C:\hisaab
```

---

## 3. Settings file (`.env`) banayein

Folder mein `.env.example` naam ki file hai. Is ki copy bana kar naam **`.env`** rakhein.

- Windows: `copy .env.example .env`
- Mac/Linux: `cp .env.example .env`

Ab `.env` ko Notepad (ya kisi bhi editor) mein khol kar ye lines bharein:

| Line | Kya likhna hai |
|---|---|
| `DOMAIN=` | `localhost` |
| `POSTGRES_PASSWORD=` | Lamba mushkil password (kam az kam 20 huroof), misaal: `Ret8Bajri!Seement2026Khata` |
| `POSTGRES_ADMIN_PASSWORD=` | Ek **aur** alag lamba password |
| `JWT_SECRET=` | Ek **aur** bohat lamba random text (40+ huroof) |
| `BOOTSTRAP_ADMIN_NAME=` | Malik ka naam |
| `BOOTSTRAP_ADMIN_PHONE=` | Malik ka login (phone number ya naam, misaal: `admin`) |
| `BOOTSTRAP_ADMIN_PASSWORD=` | Malik ka pehla password |
| `BUSINESS_NAME=` | Dukaan ka naam (challan aur bill par chhapta hai) |
| `FIN_YEAR_START_MONTH=` | Saal kab shuru hota hai: `7` = July se June, `4` = April se March, `1` = January se December |

Baqi lines jaisi hain waisi rehne dein.

> **Zaroori:** `.env` file kisi ko na bhejein, aur ye passwords kahin likh kar mehfooz jagah rakhein.
> Ye password gum ho gaye to database tak pohanchna mushkil ho jaye ga.

---

## 4. Pehli dafa chalayein

Docker Desktop on hona chahiye. Phir terminal mein:

```bash
docker compose up -d --build
```

Pehli dafa 5 se 15 minute lag sakte hain (internet se cheezein download hoti hain). Baad mein ye jaldi chalta hai.

Chal gaya ya nahi, check karne ke liye:

```bash
docker compose ps
```

Chaar cheezein **running** dikhni chahiye: `db`, `api`, `caddy`, `backup`.

---

## 5. Login karein

Browser (Chrome) mein kholein:

- **Malik (owner):** https://localhost/admin/login
- **Munshi:** https://localhost/accountant/login

Pehli dafa browser kahe ga "Your connection is not private". Ye local computer ki wajah se hai, koi khatra nahi.
**Advanced** dabayein, phir **Proceed to localhost**.

Malik step 3 wale `BOOTSTRAP_ADMIN_PHONE` aur `BOOTSTRAP_ADMIN_PASSWORD` se login kare.
**Pehle login ke baad password zaroor badlein.**

---

## 6. Kaam shuru karne se pehle (sirf ek dafa)

Malik ke login se, is tarteeb mein:

1. **Users**: munshi ka account banayein (role: accountant).
2. **Masters**: customers, suppliers, materials (ret, bajri, cement...), gaariyan, staff, cash/bank accounts.
3. **Opening balances**: shuru ki tareekh chunein, phir har customer/supplier ka purana baqaya, cash, bank,
   aur yard mein maujood maal (stock) us ke rate ke saath darj karein.
4. Us tareekh ke baad sab kuch portal mein likhein. Pehle 2 se 4 hafte register bhi saath chalayein aur
   khata reports se milate rahein.

---

## 7. Roz ka istemal

- Computer on karein, Docker Desktop khud chal jaye ga aur portal bhi (agar Docker Desktop settings mein
  "Start when you sign in" on hai).
- Agar portal na khule to terminal mein ye chalayein:

```bash
cd C:\hisaab
docker compose up -d
```

- Band karna ho (aam taur par zaroorat nahi):

```bash
docker compose stop
```

> **Kabhi bhi** `docker compose down -v` na chalayein. `-v` se **sara data mit jata hai**.

---

## 8. Backup (bohat zaroori)

Portal har raat 2 baje khud backup banata hai, lekin wo **isi computer** ke andar rehta hai.
Computer kharab ya chori ho gaya to backup bhi chala jaye ga.

Is liye **har hafte** backup bahar copy karein (USB ya Google Drive mein):

```bash
docker compose cp backup:/backups ./backups-copy
```

Is se folder mein `backups-copy` ban jaye ga. Use USB / Google Drive par rakh lein.

Online (B2 / S3) par khud-ba-khud backup bhejna ho to `.env` mein `BACKUP_OFFSITE_REMOTE` aur `RCLONE_*` lines
bharni hongi. Is ke liye developer se rabta karein.

---

## 9. Munshi phone se chalana chahe (isi WiFi par)

Step 5 wala `https://localhost` sirf usi computer par chalta hai. Agar munshi dukaan ki WiFi par apne
phone se entry karna chahe:

1. `.env` mein ye badlein / likhein:

   ```
   DOMAIN=http://:80
   COOKIE_SECURE=false
   ```

2. Dobara chalayein: `docker compose up -d`
3. Computer ka IP maloom karein (Windows: `ipconfig`, "IPv4 Address", misaal `192.168.1.10`).
4. Phone ke browser mein: `http://192.168.1.10/accountant/login`

Dhyan rahe:
- Computer **on** hona chahiye aur phone **usi WiFi** par.
- Windows Firewall agar poochhe to Docker ko "Allow" kar dein.
- Ye tareeqa sirf dukaan ki apni WiFi ke liye hai. Bahar se (doosri jagah se) chalana ho to portal ko online
  server (VPS) par lagana behtar hai. Developer se rabta karein.

---

## 10. Naya update aaye to

Developer naya code de to:

- **GitHub**: `git pull`
- **Zip**: naye code ko purane folder mein replace kar dein, lekin apni **`.env` file na mitayein**.

Phir:

```bash
docker compose up -d --build
```

Database ki tabdeeliyan khud lag jati hain. Data mehfooz rehta hai.
Update se pehle step 8 wala backup copy kar lena acha hai.

---

## 11. Masla aaye to

| Masla | Hal |
|---|---|
| `docker: command not found` | Docker Desktop install nahi hua ya chal nahi raha. Use kholein. |
| `set POSTGRES_PASSWORD in .env` jaisa error | `.env` mein wo line khaali hai. Step 3 dobara dekhein. |
| `port is already allocated` (80 ya 443) | Koi aur program (Skype, IIS, XAMPP) ye port use kar raha hai. Use band karein. |
| Page nahi khulta | `docker compose ps` chalayein. Koi cheez running nahi to `docker compose up -d`. |
| Login par "Too many login attempts" | 1 minute ruk kar dobara koshish karein. |
| Malik ka password bhool gaye | Developer se rabta karein. |

Ghalti ki tafseel dekhni ho (developer ko bhejne ke liye):

```bash
docker compose logs api --tail 100
```
