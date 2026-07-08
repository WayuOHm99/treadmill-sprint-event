# Curved Treadmill Sprint — ตารางอันดับสด

เว็บแอพสำหรับงานวิ่ง 30 วินาทีบน Curved Treadmill: ลงทะเบียนผู้เข้าร่วม, บันทึกผลระยะทาง (Bluetooth อัตโนมัติ + กรอกมือ), แสดงตารางอันดับสด, และ export เป็น Excel

## Stack
- **Next.js 14** (App Router, static export) + Tailwind CSS
- **Supabase**: Postgres (ข้อมูล + RLS), Storage (รูปโปรไฟล์), Realtime (อัปเดตตารางอันดับสด), Edge Functions (งานฝั่งสตาฟ)
- **Netlify**: hosting (static)
- **GitHub**: เก็บซอร์สโค้ด + CI/CD ไปที่ Netlify

## โครงสร้างระบบ / ความปลอดภัย

| ส่วน | ใช้ key ไหน | ทำอะไรได้ |
|---|---|---|
| หน้า `/register` | Publishable/anon key (public) | **เพิ่ม**ผู้ลงทะเบียนใหม่เท่านั้น ไม่สามารถอ่าน/แก้ข้อมูลคนอื่นได้ |
| หน้า `/` (leaderboard) | Publishable/anon key (public) | อ่านได้เฉพาะตาราง `leaderboard_public` (ชื่อ, คณะ, เพศ, รูป, ระยะทาง) **ไม่มี**เบอร์โทร/รหัสนักศึกษา |
| หน้า `/staff/results` และ `/staff/export` | เรียกผ่าน **Edge Function** ด้วย "รหัสลับสตาฟ" (`?key=...`) | ค้นหา/บันทึกผล/ดึงข้อมูลครบ (รวมเบอร์โทร) เฉพาะผู้ถือลิงก์ลับ |

**รหัสลับสตาฟ (staff secret) ปัจจุบันคือ:**
```
No-CSCUzuSjazrYBxt5gmo2wcE_JLuET
```
เก็บอยู่ในตาราง `app_secrets` ของ Supabase (ไม่มีใคร query ผ่าน public key ได้) — เปลี่ยนได้เองทีหลังผ่าน Supabase SQL editor:
```sql
update app_secrets set value = 'รหัสใหม่ของคุณ' where key = 'staff_secret';
```

⚠️ **ข้อจำกัดที่ควรรู้:** นี่คือ "ลิงก์ลับ" ไม่ใช่ระบบ login จริง ใครก็ตามที่มีลิงก์นี้สามารถบันทึกผล/โหลดข้อมูลเบอร์โทรได้ ถ้าลิงก์หลุดควรเปลี่ยนรหัสทันทีตามคำสั่งข้างบน

หลังจากมี URL เว็บไซต์จริงแล้ว ลิงก์ที่ต้องแจกให้สตาฟคือ:
```
https://<เว็บไซต์ของคุณ>/staff/results/?key=No-CSCUzuSjazrYBxt5gmo2wcE_JLuET
https://<เว็บไซต์ของคุณ>/staff/export/?key=No-CSCUzuSjazrYBxt5gmo2wcE_JLuET
```

## เรื่อง Bluetooth (Assault AirRunner)

ปุ่ม "เชื่อมต่อลู่วิ่ง" ในหน้า `/staff/results` ใช้ Web Bluetooth อ่านค่า **Total Distance** จาก FTMS (Fitness Machine Service) มาตรฐาน — ใช้ได้เฉพาะ **Chrome/Edge บนคอมพิวเตอร์หรือ Android** (ไม่รองรับ iPhone/Safari)

Assault ไม่มีเอกสาร API ที่เปิดเผยอย่างเป็นทางการ จึงยังไม่ยืนยัน 100% ว่าจะจับสัญญาณติดจนกว่าจะทดสอบกับเครื่องจริง **แนะนำให้ทดสอบก่อนวันงานจริง** ถ้าเชื่อมไม่ติด ระบบยัง fallback ไปโหมดกรอกมือได้เสมอ ไม่กระทบการใช้งาน

วิธีทำงาน: กด "เชื่อมต่อลู่วิ่ง" → เลือกอุปกรณ์ → กด "เริ่มจับเวลา 30 วินาที" → ระบบจดระยะทางตอนเริ่มและตอนจบ แล้วคำนวณระยะที่วิ่งได้ให้อัตโนมัติ (ยังแก้ไขเลขในช่องได้ก่อนกดบันทึก)

## รันบนเครื่องตัวเอง (dev)

```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase URL/anon key ของคุณ
npm run dev
```

## Build

```bash
npm run build   # ได้ static site อยู่ในโฟลเดอร์ out/
```

## เชื่อม GitHub

โปรเจกต์นี้ init git ไว้ให้แล้วพร้อม commit แรก คุณสามารถ push ขึ้น repo ของคุณเองได้เลย:

```bash
git remote add origin https://github.com/<username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## เชื่อม Netlify (แบบ CI/CD ต่อเนื่องจาก GitHub — แนะนำ)

ผมลองสั่ง deploy ตรงจากแซนด์บ็อกซ์ให้แล้ว แต่เครือข่ายของผมไม่ได้เปิดให้เชื่อมต่อโดเมนของ Netlify โดยตรง (ติด network egress restriction ของฝั่งผม ไม่ใช่ปัญหาของคุณ) วิธีที่ดีที่สุด — และเป็น workflow แบบมืออาชีพที่คุณต้องการอยู่แล้ว — คือเชื่อมผ่าน GitHub โดยตรง:

1. Push โค้ดขึ้น GitHub ตามขั้นตอนด้านบน
2. เข้า https://app.netlify.com/projects/treadmill-sprint-event (ไซต์นี้สร้างรอไว้ให้แล้ว)
3. ไปที่ **Site configuration → Build & deploy → Link repository** เลือก repo ของคุณ
4. ตั้งค่า Build command: `npm run build` และ Publish directory: `out`
5. Environment variables ตั้งไว้ให้แล้วในไซต์นี้ (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) ไม่ต้องใส่ซ้ำ
6. กด Deploy — ทุกครั้งที่ push ขึ้น `main` จะ build/deploy ให้อัตโนมัติ

Site URL ปัจจุบัน (ยังไม่มีโค้ด จนกว่าจะเชื่อม repo): `https://treadmill-sprint-event.netlify.app`

## Supabase

- Project: `WayuOHm99's Project` (`tnmxpwcyfaekwwwrefjd`)
- ตาราง `participants`, view/table สาธารณะ `leaderboard_public`, Storage bucket `participant-photos`
- Edge Functions: `staff-search`, `staff-submit-result`, `staff-export`
