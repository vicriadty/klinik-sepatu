# PRD Backend — Cleaning Shoe Service POS

## 1. Document Purpose

Dokumen ini adalah spesifikasi produk dan teknis untuk backend aplikasi POS UMKM jasa cleaning sepatu.

Backend menjadi **single source of truth** untuk:

- autentikasi dan otorisasi;
- customer;
- service cleaning dan harga;
- order dan item sepatu;
- pembayaran;
- workflow cleaning;
- foto sepatu;
- laporan transaksi;
- export Excel;
- notifikasi;
- user management;
- audit log.

Backend dikonsumsi oleh dua client:

1. Mobile POS berbasis React Native.
2. Owner Dashboard berbasis React + Vite.

Keputusan arsitektur yang mengikat dokumen ini tercatat di `docs/adr/`
(ADR-0001 s/d ADR-0012); istilah domain mengikuti `docs/glossary.md`.

## 2. Scope Bisnis

### 2.1 Target

Satu toko cleaning sepatu mandiri. Tidak ada kebutuhan multi-branch pada MVP.

### 2.2 Prinsip

- Backend authoritative untuk seluruh nilai transaksi.
- Harga service berasal dari backend, bukan hard-coded di client.
- Satu order dapat memiliki banyak item sepatu.
- Setiap item sepatu dapat memiliki service, foto, catatan sendiri; pada MVP
  item mengikuti status order (tidak ada status per-item).
- Semua perubahan status penting dicatat sebagai history.
- Semua aksi administratif penting dicatat dalam audit log.
- Sistem harus dapat dikembangkan ke multi-staff dan volume transaksi lebih tinggi tanpa redesign besar.

## 3. Technical Stack

- PHP 8.4
- Laravel 13
- REST API
- PostgreSQL 16
- Eloquent ORM
- Laravel Sanctum personal access tokens (ADR-0003) — satu mekanisme untuk
  web dan mobile; tanpa refresh endpoint
- Laravel Queue dengan database queue untuk MVP
- Redis belum menjadi dependency wajib; arsitektur harus memungkinkan migrasi queue/cache ke Redis di masa depan
- MinIO via Docker sebagai S3-compatible object storage untuk foto (ADR-0007)
- Laravel Excel / PhpSpreadsheet ecosystem untuk XLSX
- Pest untuk semua layer test (unit, feature, contract) (ADR-0011)
- Scramble untuk OpenAPI documentation otomatis (ADR-0011)
- Docker untuk development dan deployment

## 4. Non-Goals MVP

Tidak termasuk:

- multi-branch;
- accounting penuh;
- payroll;
- marketplace;
- customer mobile app terpisah;
- microservices;
- warehouse management kompleks;
- AI diagnosis sepatu.

## 5. User Roles

### OWNER

Hak penuh:

- melihat dashboard dan seluruh laporan;
- mengelola user;
- mengelola service dan harga;
- mengelola master discount;
- melihat transaksi;
- melakukan export;
- mengakses audit log;
- mengubah konfigurasi bisnis (settings).

### ADMIN

Hak operasional dan backoffice:

- mengelola customer;
- mengelola transaksi;
- melihat laporan yang diizinkan;
- mengelola service bila policy mengizinkan.
  Tidak boleh mengelola owner.

### CASHIER

Hak:

- login;
- mencari/membuat customer;
- membuat order;
- menerima pembayaran;
- melihat order dan status;
- mengunggah foto penerimaan;
- mengakses dashboard summary versi counts operasional (tanpa revenue,
  lihat §20).
  Tidak boleh:
- membuat user;
- mengubah master service/discount tanpa permission;
- menghapus transaksi secara hard delete;
- mengakses fungsi owner-only.

## 6. Order Domain

### 6.1 Order

Satu order mewakili satu transaksi/customer visit.

Contoh:

- ORD-20260908-0001
- Customer Budi
- 2 pasang sepatu
- Total Rp130.000

Nomor order di-generate dari daily sequence dengan row-level lock
(`daily_sequences`), reset harian zona `Asia/Jakarta`, gap diperbolehkan
(ADR-0009).

### 6.2 Order Item

Setiap sepatu merupakan order item.

Informasi minimal:

- brand;
- model/name;
- color;
- shoe type;
- customer note;
- internal note;
- photos;
- selected services.

Pada MVP, order item tidak memiliki status sendiri — status hidup di level
order (ADR-0001).

### 6.3 Service

Service merupakan master priceable item.

Field minimal:

- name;
- category_id;
- description;
- price (integer rupiah);
- estimated_duration_days atau duration estimate;
- active.

Harga dapat berubah. Riwayat perubahan harga harus masuk audit log
(SERVICE_PRICE_CHANGED). Perubahan harga tidak pernah mengubah order lama —
harga di-snapshot ke `order_item_services.unit_price` saat order dibuat
(ADR-0004).

### 6.4 Discount

Discount adalah master data milik owner (ADR-0004):

Field minimal:

- name;
- type: PERCENT | FIXED;
- value: 1–100 (PERCENT) atau nominal rupiah (FIXED);
- active;
- min_order_subtotal (opsional).

Maksimal satu discount per order, dipilih via `discount_id` saat create
order. Tidak ada input nominal diskon bebas di MVP.

## 7. Order Status

Status utama MVP — satu-satunya level status, di order (ADR-0001):

```text
RECEIVED
ON_PROCESS
READY_FOR_PICKUP
COMPLETED
CANCELLED
```

Transition matrix:

```text
                 → ON_PROCESS → READY_FOR_PICKUP → COMPLETED → CANCELLED
RECEIVED              ya               tidak          tidak        ya
ON_PROCESS             —                 ya           tidak        ya
READY_FOR_PICKUP     tidak                —             ya        tidak
COMPLETED            tidak             tidak             —        tidak
CANCELLED            tidak             tidak          tidak          —
```

Aturan:

- status tidak boleh dilompati;
- perubahan status harus melalui endpoint backend
  (`POST /orders/{id}/status` atau `POST /orders/{id}/cancel`);
- backend harus memvalidasi transition; pelanggaran matrix → 422;
- setiap transition membuat `order_status_histories` record;
- `COMPLETED` hanya boleh bila `payment_status = PAID` (force settlement,
  ADR-0002);
- `CANCELLED` hanya boleh dari RECEIVED atau ON_PROCESS; bila sudah ada
  payment, refund wajib dicatat terlebih dahulu;
- order yang sudah COMPLETED tidak dapat diubah sembarangan.

## 8. Payment Domain

Payment status (derived, dihitung server, tidak pernah input client):

- UNPAID
- PARTIAL
- PAID
- REFUNDED (future)

Payment method MVP:

- CASH
- QRIS
- TRANSFER

Urutan wajib (order-first, ADR-0002):

1. `POST /orders` membuat order dengan payment_status UNPAID;
2. payment dicatat setelahnya via `POST /orders/{order}/payments`.

QRIS dan TRANSFER dicatat oleh kasir setelah verifikasi manual
(mutation/app acquirer) — tanpa gateway, tanpa webhook di MVP. Tabel
`payment_transactions` tidak dipakai di MVP (dicadangkan untuk fase
gateway).

Backend bertanggung jawab menghitung:

- subtotal;
- discount;
- grand total;
- amount paid;
- remaining balance.

Client boleh menampilkan preview total, tetapi nilai final harus berasal dari backend.

## 9. Pricing Rules

Semua nilai uang adalah integer rupiah (BIGINT, min 0) — tidak ada desimal
dan tidak ada float di pipeline harga (ADR-0004).

Formula default:

```text
item subtotal = sum(snapshot unit_price per service)
order subtotal = sum(item subtotal)
discount_value = PERCENT: floor(subtotal × value / 100)
                 FIXED:   value  (clamp ≤ subtotal)
grand total = order subtotal - discount_value
remaining = grand total - total paid
```

Acceptance criteria:

- total tersimpan secara immutable sebagai nilai transaksi;
- perubahan harga service di masa depan tidak mengubah order lama
  (snapshot `unit_price`);
- hanya `discount_id` (master discount aktif) yang diterima — tanpa nominal
  bebas; maksimal satu per order;
- rounding: percent dibulatkan turun ke rupiah utuh;
- backend menolak nominal negatif atau tidak valid.

## 10. Database Model

Minimal table:

```text
users
customers
service_categories
services
discounts
daily_sequences
orders
order_items
order_item_services
order_item_photos
order_status_histories
payments
payment_transactions        # cadangan gateway; tidak dipakai MVP
report_exports
audit_logs
notifications
settings
jobs
failed_jobs
personal_access_tokens      # Sanctum (ADR-0003)
```

Kolom audit umum:

- id;
- created_at;
- updated_at;
- deleted_at jika soft delete relevan.

Catatan penting:

- `order_items` tidak memiliki kolom status di MVP (ADR-0001);
- `orders` menyimpan `order_subtotal`, `discount_id`, `discount_value`,
  `grand_total`, `paid_total`, `payment_status` (derived);
- `order_item_services` menyimpan snapshot `unit_price` (ADR-0004);
- `daily_sequences` menyimpan (date PK, last_number) untuk nomor order
  (ADR-0009);
- `customers.phone` unique + kanonik `62…` (ADR-0008);
- `users.username` unique; `users.email` nullable (ADR-0003).

## 11. Database Constraints & Indexes

Wajib:

- order number unique;
- username unique;
- customer phone unique (kanonik `62…`);
- customer phone index (search);
- service active index;
- orders created_at index;
- orders customer_id index;
- orders status index;
- order_status_histories order_id + created_at index;
- payments order_id index;
- daily_sequences date primary key.

Gunakan foreign key constraint dan transaction database untuk operasi multi-table yang harus atomik.

## 12. API Convention

Base path:

```text
/api/v1
```

Format response konsisten. List endpoint memakai offset pagination
(ADR-0011): `?page=&per_page=` (per_page capped, mis. 100) dengan meta
`total`, `last_page`.

Success example:

```json
{
    "data": {},
    "meta": {}
}
```

Error example:

```json
{
    "message": "Validation failed",
    "errors": {
        "phone": ["The phone field is required."]
    }
}
```

Gunakan HTTP status yang tepat:

- 200 OK
- 201 Created
- 204 No Content
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 500 Internal Server Error

## 13. Authentication API

```text
POST   /auth/login
POST   /auth/logout
GET    /auth/me
```

Mekanisme: Sanctum personal access tokens untuk web dan mobile
(ADR-0003). Tidak ada refresh endpoint. Login identifier = username;
email opsional dan tidak dipakai untuk login.

## 14. User API

```text
GET    /users
POST   /users
GET    /users/{id}
PUT    /users/{id}
PATCH  /users/{id}/status
DELETE /users/{id}
```

Owner-only operations harus dilindungi policy.

## 15. Customer API

```text
GET    /customers
POST   /customers
GET    /customers/{id}
PUT    /customers/{id}
```

Search:

```text
GET /customers?search=...
```

Search menerima format nomor apa pun (normalisasi ke `62…` untuk digit-only
query) dan juga cocok dengan name (ADR-0008). Create/update dengan phone
yang sudah terdaftar → 409 dengan pesan actionable.

## 16. Service API

```text
GET    /service-categories
POST   /service-categories
GET    /service-categories/{id}
PUT    /service-categories/{id}
DELETE /service-categories/{id}

GET    /services
POST   /services
GET    /services/{id}
PUT    /services/{id}
DELETE /services/{id}
PATCH  /services/{id}/status
```

Delete service sebaiknya soft delete/nonaktifkan, bukan hard delete, bila service pernah dipakai transaksi.

## 17. Order API

```text
GET    /orders
POST   /orders
GET    /orders/{id}
PUT    /orders/{id}
POST   /orders/{id}/status
POST   /orders/{id}/cancel
```

Order creation harus mendukung banyak item.

Order immutable setelah dibuat (ADR-0004): `PUT /orders/{id}` hanya boleh
mengubah notes (customer note / internal note). Item, service, discount,
dan total terkunci; koreksi = cancel → order baru.

Contoh payload konseptual:

```json
{
    "customer_id": 10,
    "items": [
        {
            "brand": "Nike",
            "model": "Air Force 1",
            "color": "White",
            "shoe_type": "Sneakers",
            "notes": "Yellowing on sole",
            "services": [2, 5]
        }
    ],
    "discount_id": null
}
```

## 18. Photo API

```text
POST /order-items/{item}/photos
GET  /order-items/{item}/photos
DELETE /order-item-photos/{photo}
```

Jenis (type — satu-satunya sumbu data foto, ADR-0007):

- BEFORE
- AFTER
- DAMAGE
- QC

File tidak disimpan sebagai blob database. Storage: MinIO (S3-compatible)
dengan filename UUID dan public URL (ADR-0007). Kategori sudut
(front/back/left/right/top) di mobile adalah UI guidance, bukan data
model.

## 19. Payment API

```text
GET  /orders/{order}/payments
POST /orders/{order}/payments
```

Payment hanya untuk order yang sudah ada (order-first, ADR-0002).
`payment_status` dihitung server dari total payments vs grand_total.
Overpayment ditolak (422). Payment gateway callback/webhook tidak ada di
MVP (QRIS statis + konfirmasi manual); idempotency key tetap wajib untuk
create payment bila dikirim ulang dari mobile.

## 20. Dashboard API

```text
GET /dashboard/summary
GET /dashboard/revenue
GET /dashboard/orders
GET /dashboard/top-services
GET /dashboard/payment-methods
```

Default timezone bisnis: `Asia/Jakarta`.

Revenue dihitung berdasarkan tanggal order dibuat (order-creation basis,
ADR-0005): Σ grand_total order non-cancelled yang dibuat pada periode;
payment status (UNPAID/PARTIAL/PAID) menjadi dimensi breakdown, bukan
filter revenue. `dashboard/payment-methods` memakai baris payment
(receipt basis) dan dilabeli demikian di UI.

Akses role:

- OWNER dan ADMIN: seluruh dashboard;
- CASHIER: hanya `summary` versi counts operasional (orders today, in
  progress, ready for pickup, outstanding) — tanpa angka revenue.

## 20a. Settings API

```text
GET  /settings
PUT  /settings
```

Owner-only. Field MVP: store name, store phone, address, receipt footer,
timezone (default Asia/Jakarta), notification configuration status.
Settings bisnis tersimpan di database (tabel `settings`), dibaca via API —
bukan dari environment frontend.

## 21. Reports API

```text
GET  /reports/transactions
GET  /reports/revenue
GET  /reports/services
GET  /reports/customers
POST /reports/exports
GET  /reports/exports
GET  /reports/exports/{id}
```

Export besar harus menggunakan queue. `POST /reports/exports` membuat
record `report_exports` lalu dispatch queued job; `GET /reports/exports`
menampilkan daftar export milik user; `GET /reports/exports/{id}` untuk
polling status + URL download saat COMPLETED.

## 22. Excel Export

Report minimum:

- transaction report;
- revenue report;
- service performance report;
- customer report.

File harus `.xlsx`.

Kolom transaction report minimal:

```text
order_number
date
customer
service
qty
subtotal
discount
grand_total
payment_method
payment_status
order_status
```

Export job:

```text
POST export request
→ create export record
→ dispatch queued job
→ generate XLSX
→ store file
→ mark completed
→ client polls/downloads
```

## 23. Notification Architecture

Gunakan abstraction:

```text
WhatsAppProvider
PushProvider
```

Domain tidak boleh mengetahui detail vendor. Implementasi MVP:
`WhatsAppCloudProvider` — WhatsApp Cloud API resmi (Meta) (ADR-0006).

Event MVP (masing-masing satu template WhatsApp yang di-approve Meta):

```text
ORDER_RECEIVED_RECEIPT   # struk digital: order number, item, total, footer
PAYMENT_RECEIVED         # nominal, metode, sisa / PAID
ORDER_READY_FOR_PICKUP   # ajakan ambil + nomor order
ORDER_COMPLETED          # terima kasih + ajakan order lagi
```

Aturan:

- pengiriman via queue; kegagalan kirim tidak membatalkan operasi bisnis;
- setiap pengiriman tercatat di `notifications`
  (event, channel, recipient, status QUEUED/SENT/FAILED/SKIPPED,
  provider message id, attempts);
- phone customer invalid/kosong → status SKIPPED;
- template Meta approval adalah critical path go-live — dimulai sejak awal.

## 24. Queue

MVP:

```text
QUEUE_CONNECTION=database
```

Gunakan queue untuk:

- Excel export;
- notification (WhatsApp);
- image processing (thumbnail);
- payment webhook follow-up bila perlu (future).

Design harus memungkinkan migrasi ke Redis tanpa mengubah domain service.

## 25. Audit Log

Simpan:

- actor user id;
- action;
- entity type;
- entity id;
- before payload bila relevan;
- after payload bila relevan;
- timestamp;
- IP/user agent bila kebijakan privasi mengizinkan.

Minimal action:

- USER_CREATED;
- USER_UPDATED;
- SERVICE_CREATED;
- SERVICE_UPDATED;
- SERVICE_PRICE_CHANGED;
- DISCOUNT_CREATED;
- DISCOUNT_UPDATED;
- ORDER_CREATED;
- ORDER_UPDATED;
- ORDER_CANCELLED;
- PAYMENT_CREATED;
- PAYMENT_REFUNDED;
- STATUS_CHANGED.

## 26. Security Requirements

- Password harus di-hash menggunakan Laravel default secure hashing.
- Token/session tidak boleh dicatat ke log.
- Authorization wajib dilakukan di backend.
- Input divalidasi menggunakan Form Request/validation layer.
- File upload divalidasi mime type, size, dan extension.
- Rate limit diterapkan pada endpoint auth dan endpoint sensitif.
- CORS dibatasi ke origin yang diperlukan.
- Secrets hanya melalui environment configuration (termasuk kredensial
  WhatsApp Cloud API).
- Jangan expose internal exception detail di production.

## 27. Idempotency

Operasi yang berpotensi dikirim ulang dari mobile harus aman terhadap retry.

Minimal:

- create order (idempotency key / client UUID);
- create payment;
- payment callback (future, bila gateway digunakan).

Gunakan idempotency key header (mis. `Idempotency-Key: <uuid>`) untuk
operasi yang relevan; retry dengan key yang sama mengembalikan hasil
request pertama, bukan duplikat.

## 28. Offline Compatibility

Backend tidak perlu offline. Backend harus menyediakan pola sync yang dapat digunakan mobile.

Tambahkan identifier client untuk operasi yang dapat di-retry:

- idempotency key (§27) untuk create order/payment;
- order-first flow (ADR-0002) memastikan order tersimpan aman sebagai
  UNPAID bila koneksi terputus sebelum payment.

## 29. Testing Requirements

Framework: Pest (unit, feature, contract) (ADR-0011). Aturan matriks
(transition matrix, permission matrix, pricing table) ditulis sebagai
dataset test.

Unit test:

- pricing (integer rupiah, snapshot, percent floor, clamp);
- status transition (matrix ADR-0001, guard PAID/refund);
- payment balance (derived status, overpayment rejection);
- permission (role matrix);
- phone normalization (ADR-0008);
- order number generation (concurrent sequence).

Feature test:

- login;
- customer CRUD + duplicate phone 409;
- service CRUD;
- create multi-item order;
- payment;
- upload photo;
- report;
- export;
- authorization;
- settings API;
- notification dispatch (queued, non-blocking).

Contract test:

- response schema API yang dipakai mobile/dashboard harus stabil,
  divalidasi terhadap OpenAPI spec hasil Scramble (ADR-0011).

## 30. Definition of Done

Backend dianggap selesai untuk MVP bila:

- migration reproducible;
- seed data tersedia;
- auth berjalan (Sanctum PAT, username login);
- semua core API teruji;
- authorization teruji;
- pricing deterministik;
- order/payment/status konsisten;
- XLSX export berjalan;
- queue berjalan;
- audit log berjalan;
- notifikasi WhatsApp berjalan (4 event) beserta delivery status;
- API documentation tersedia (OpenAPI/Scramble);
- error format konsisten;
- dapat dijalankan melalui Docker (app + PostgreSQL + MinIO);
- environment production tidak bergantung pada local-only service.

## 31. AI Agent Implementation Rules

AI Agent wajib:

1. membaca file ini dan ADR terkait (`docs/adr/`) sebelum mengubah backend;
2. tidak mengubah contract API tanpa memperbarui spesifikasi dan ADR;
3. tidak menambahkan dependency besar tanpa alasan;
4. menulis migration sebelum feature yang membutuhkan data;
5. menulis test untuk business rule baru;
6. mempertahankan backward compatibility endpoint selama MVP kecuali eksplisit diminta;
7. tidak memindahkan business logic ke React client;
8. menggunakan domain/service/action layer untuk business logic kompleks;
9. tidak melakukan destructive migration tanpa instruksi eksplisit;
10. menampilkan daftar file yang dibuat/diubah dan test yang dijalankan pada setiap task.

opencode -s ses_f7922a049ffesnE0RCCmQDMh35
opencode -s ses_f7922a049ffesnE0RCCmQDMh35
