# PRD Mobile — Cleaning Shoe Service POS

## 1. Document Purpose

Mobile application operasional toko untuk kasir dan staf yang menjalankan proses penerimaan, transaksi, pembayaran, dan tracking cleaning sepatu.

Mobile menggunakan Laravel API yang didefinisikan di `prd-backend.md`.

Keputusan arsitektur yang mengikat tercatat di `docs/adr/`; istilah domain
mengikuti `docs/glossary.md`. UI berbahasa Indonesia (ADR-0012).

## 2. Product Goal

Mobile harus membuat proses toko cepat dan minim input:

```text
Customer
→ Shoes
→ Service
→ Photo
→ Review
→ Create Order (UNPAID)
→ Payment
→ Order Created + Paid
```

Urutan order-first (ADR-0002): order dibuat dulu (payment_status UNPAID),
lalu kasir mencatat payment. Bila koneksi terputus setelah order dibuat,
order tetap aman — payment bisa dilanjutkan dari order list.

Aplikasi juga harus mendukung tracking order dan, pada fase berikutnya, cleaning workflow.

## 3. Technical Stack

- React Native
- Expo
- TypeScript
- React Navigation
- TanStack Query
- Zustand
- React Hook Form
- Zod
- SQLite untuk local persistence/offline support
- Camera/image picker dari Expo ecosystem

## 4. User Roles

MVP utama:
- CASHIER
- ADMIN
- OWNER bila dibutuhkan untuk emergency/monitoring ringan.

UI dan endpoint mengikuti permission dari backend.

## 5. Navigation

Structure konseptual:

```text
Auth Stack
└── Login

App Stack
├── Home
├── New Order
├── Orders
├── Customers
├── Order Detail
└── Profile/Settings
```

Untuk device dengan layar kecil, action utama `New Order` harus mudah ditemukan.

## 6. Login

Field:
- username;
- password.

Requirement:
- secure token storage (Expo SecureStore / Keystore-backed, ADR-0003);
- session restore saat app dibuka;
- logout;
- error state;
- unauthorized state.

Mekanisme: Sanctum PAT; tanpa refresh endpoint — 401 → logout.

Jangan menyimpan password plaintext.

## 7. Home

Tampilkan informasi operasional ringkas (counts; CASHIER tanpa angka
revenue, prd-backend.md §20):
- orders today;
- in progress;
- ready for pickup;
- outstanding payment.

Quick actions:
- New Order;
- Orders;
- Customers.

Home bukan dashboard BI lengkap.

## 8. Customer Search

Flow:

```text
Search phone/name
→ select customer
```

Bila tidak ditemukan:

```text
Create Customer
```

Field minimal:
- name;
- phone.

Validasi phone mengikuti backend: normalisasi ke kanonik `62…`
(ADR-0008). UI menampilkan preview nomor ternormalisasi dan menerima
input format Indonesia apa pun (0812…/+62…); bila backend menjawab
duplicate (409), tawarkan customer existing.

## 9. New Order — Step 1 Customer

User memilih customer existing atau membuat customer baru.

State harus tersimpan selama wizard berlangsung agar berpindah langkah tidak menghilangkan input.

## 10. New Order — Step 2 Shoe Item

Field minimal:
- brand;
- model/name;
- color;
- shoe type;
- notes.

Satu order dapat memiliki banyak item sepatu. Item mengikuti status order
(tidak ada status per-item di MVP, ADR-0001).

UI:

```text
Order
├── Shoe 1
├── Shoe 2
└── + Add Shoe
```

Setiap item memiliki service sendiri.

## 11. New Order — Step 3 Service Selection

Service diambil dari API.

Tampilkan:
- service name;
- description bila tersedia;
- price;
- estimated duration bila tersedia.

Mobile tidak boleh meng-hard-code daftar service atau harga.

User dapat memilih lebih dari satu service bila backend mengizinkan.

## 12. New Order — Step 4 Photo

Foto BEFORE direkomendasikan dan menjadi bagian utama SOP toko.

Kategori sudut (front/back/left/right/top/damage) adalah **guidance UI
wizard** (checklist kelengkapan foto) — bukan data model. Data foto hanya
menyimpan `type` backend: BEFORE / AFTER / DAMAGE / QC (ADR-0007).

Foto harus dapat:
- diambil dari kamera;
- dipilih dari gallery bila policy mengizinkan;
- preview;
- retake;
- remove sebelum submit.

Foto perlu dikompres sebelum upload bila ukuran terlalu besar.

## 13. New Order — Step 5 Review

Tampilkan ringkasan:

```text
Customer
Shoes
Services per shoe
Subtotal
Discount
Grand Total
```

Diskon hanya boleh berupa master discount terdaftar yang dikembalikan
backend (pilih maksimal satu, kirim `discount_id`); tidak ada input
nominal bebas (ADR-0004). Preview total memakai aturan yang sama
(integer rupiah, percent dibulatkan turun).

CTA:
`Create Order`

## 14. Payment

Ditampilkan SETELAH order berhasil dibuat (order-first, ADR-0002):
layar sukses order → layar payment.

Pilihan MVP:
- Cash;
- QRIS (statis toko + konfirmasi manual kasir);
- Transfer.

Status (derived server):
- UNPAID;
- PARTIAL;
- PAID.

Backend adalah authority untuk hasil payment. Mobile hanya mencatat
payment via `POST /orders/{id}/payments` dan membaca `payment_status`
hasil server.

Flow QRIS MVP:

```text
Order created (UNPAID)
→ Show static QRIS (milik toko)
→ Customer scan & bayar
→ Kasir verifikasi manual (app/mutasi acquirer)
→ Kasir record payment (method QRIS)
```

Mobile tidak boleh menyatakan PAID hanya karena user menekan tombol.

## 15. Order Creation

Submit final order ke backend.

Requirement:
- gunakan idempotency key / client request UUID (header, ADR-0002);
- tampilkan progress saat submit;
- cegah double tap;
- jika retry terjadi, jangan membuat order duplikat;
- setelah sukses tampilkan order number.

Success screen:

```text
Order Created
ORD-20260908-0001

[Continue to Payment]
[View Order]
[New Order]
```

Foto BEFORE/DAMAGE diupload setelah order dibuat (ke item order yang
sudah ada, prd-backend.md §18); kegagalan upload satu foto tidak
membatalkan order — bisa di-retry dari order detail.

## 16. Order List

Filter minimum:
- date;
- status;
- payment status.

Search:
- order number;
- customer phone/name.

List item menampilkan:
- order number;
- customer;
- item count;
- total;
- status;
- payment status.

Pagination/infinite scrolling jika dataset membesar.

## 17. Order Detail

Tampilkan:
- order number;
- customer;
- items;
- services;
- photos;
- price breakdown;
- payments;
- current status;
- status history;
- notes.

Action tergantung role.

## 18. Status Tracking

MVP mengikuti 5 status order (ADR-0001):

```text
RECEIVED
ON_PROCESS
READY_FOR_PICKUP
COMPLETED
CANCELLED
```

Transition matrix dan guard rules (COMPLETED wajib PAID; CANCELLED hanya
dari RECEIVED/ON_PROCESS dengan refund record bila sudah ada payment)
dijalankan backend.

Mobile harus menggunakan status transition dari backend dan hanya
menampilkan aksi status yang legal.

Jangan langsung PATCH field status tanpa endpoint business rule.

Status granular per item (INSPECTION, CLEANING, DRYING, QC, NEED_REWORK)
menjadi bagian future phase cleaning workflow (§19-20), bukan MVP.

## 19. Cleaning Workflow — Future Phase

Untuk role CLEANER:

```text
My Tasks
→ Open Item
→ Start Cleaning
→ Drying
→ QC Queue
```

Cleaner dapat:
- melihat detail;
- membaca note;
- melihat BEFORE photo;
- memperbarui status yang diperbolehkan;
- upload AFTER/process photo.

## 20. QC — Future Phase

QC dapat:
- membuka item;
- membandingkan before/after;
- menandai pass;
- menandai rework;
- mengisi catatan.

Status tambahan future bila diperlukan:
- NEED_REWORK.

## 21. Offline-First Strategy

Offline adalah phase setelah online flow stabil.

Local SQLite menyimpan minimal:
- cached services;
- cached customers yang relevan;
- pending operations;
- local draft order.

Sync model:

```text
UI
→ Local DB
→ Sync Queue
→ Laravel API
```

Requirement:
- idempotent retry;
- conflict handling;
- sync status visible saat relevan;
- tidak menganggap local success sebagai server success untuk transaksi yang sensitif tanpa state yang jelas.

## 22. Local Draft

New Order wizard harus dapat menyimpan draft agar app crash/ditutup tidak langsung menghilangkan semua input.

Draft minimal:
- customer;
- shoe items;
- service selections;
- notes;
- local photos references.

## 23. Camera & Photo Handling

Requirement:
- resize/compress sebelum upload;
- show upload progress;
- retry failed upload;
- jangan block seluruh order jika upload non-critical dapat ditangani secara asynchronous sesuai backend contract (upload terjadi setelah order dibuat, ADR-0002);
- foto disimpan dengan `type` backend (BEFORE/AFTER/DAMAGE/QC);
- URL foto dari backend adalah public UUID URL (ADR-0007).

Jangan menyimpan file besar permanen di local storage tanpa cleanup policy.

## 24. Notifications

Push notification dapat digunakan untuk staff pada future phase.

Customer notification tidak dikirim langsung oleh mobile. Mobile memicu perubahan bisnis melalui backend; backend menjalankan notification provider
(WhatsApp Cloud API, 4 event MVP — ADR-0006: struk digital, konfirmasi
payment, siap diambil, order selesai).

Flow:

```text
Order status changed / order created / payment recorded
→ Laravel event/job (queued)
→ Notification provider (WhatsAppCloudProvider)
→ Customer
```

Kegagalan kirim tidak menggagalkan operasi bisnis di mobile.

## 25. Performance

- List menggunakan pagination.
- Cache master service yang stabil menggunakan TanStack Query.
- Hindari refetch seluruh order setiap perubahan kecil.
- Image thumbnail digunakan untuk list.
- Upload foto menggunakan compression.
- Hindari render list besar tanpa virtualization.

## 26. UX Requirements

POS harus cepat digunakan dengan satu tangan bila memungkinkan.

Prioritas:
1. New Order mudah ditemukan.
2. Search customer cepat.
3. Tambah beberapa sepatu mudah.
4. Pilih service tanpa banyak tap.
5. Foto cepat.
6. Payment jelas.
7. Success state jelas.

Gunakan confirmation hanya untuk aksi berisiko tinggi agar kasir tidak terganggu.

UI copy Bahasa Indonesia; pesan error actionable dalam Bahasa Indonesia
(mapping field error API → teks Indonesia di client, ADR-0012).

## 27. Error Handling

Jenis error:
- network unavailable;
- timeout;
- validation;
- unauthorized;
- forbidden;
- conflict/idempotency;
- server error;
- upload failure;
- payment pending/failed.

Pesan error harus actionable dan tidak menampilkan internal exception.

## 28. Accessibility & Device

MVP target:
- Android phone;
- portrait-first;
- touch targets nyaman;
- text readable.

Tablet dapat didukung tanpa redesign besar.

## 29. Security

- Token disimpan di secure storage yang sesuai platform.
- Jangan simpan password.
- Jangan log token atau data pembayaran sensitif.
- Gunakan HTTPS pada production.
- Permission selalu diverifikasi backend.
- Local database tidak menyimpan lebih banyak data sensitif dari yang dibutuhkan.

## 30. Testing

Unit/component:
- form validation;
- pricing display;
- wizard state;
- role-based rendering.

Integration:
- login;
- customer search/create;
- new multi-item order;
- payment;
- photo upload;
- order detail;
- status update.

E2E smoke:

```text
Login
→ Customer
→ Add 2 Shoes
→ Select Services
→ Take Photos
→ Review
→ Create Order (idempotent)
→ Payment
→ Upload Photos
→ View Order
```

## 31. Definition of Done

Mobile MVP dianggap selesai bila:
- login berjalan;
- session restore berjalan;
- customer search/create berjalan;
- multi-item order berjalan;
- service selection berasal API;
- before photo upload berjalan;
- pricing berasal backend;
- payment berjalan;
- order number tampil;
- order list/detail berjalan;
- status tracking berjalan;
- double submit aman;
- error/loading/empty states ditangani;
- build Android production berhasil;
- test smoke end-to-end berhasil.

## 32. AI Agent Implementation Rules

AI Agent wajib:
1. membaca `prd-backend.md` dan ADR terkait (`docs/adr/`) sebelum implementasi API integration;
2. tidak membuat business rule pricing lokal;
3. tidak hard-code status/service/role yang sudah menjadi contract backend kecuali untuk typed constants/generated contract;
4. menjaga separation antara server state dan local/UI state;
5. menggunakan TanStack Query untuk API state;
6. mencegah duplicate submission (idempotency key, cegah double tap);
7. membuat typed models/interfaces dari API contract;
8. membuat test untuk setiap wizard step dan critical mutation;
9. tidak mengimplementasikan offline sync kompleks sebelum online path stabil;
10. melaporkan endpoint yang digunakan, file berubah, dan test yang dijalankan pada setiap task;
11. UI copy Bahasa Indonesia sesuai ADR-0012.
