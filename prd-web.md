# PRD Web Dashboard — Cleaning Shoe Service POS

## 1. Document Purpose

Dashboard web khusus Owner/Admin untuk backoffice dan monitoring bisnis cleaning sepatu.

Frontend tidak menjadi source of truth. Semua data bisnis berasal dari Laravel API.

Keputusan arsitektur yang mengikat tercatat di `docs/adr/`; istilah domain
mengikuti `docs/glossary.md`. UI berbahasa Indonesia (ADR-0012).

## 2. Product Goal

Dashboard harus memungkinkan owner:
- memantau performa transaksi;
- melihat detail transaksi;
- melihat laporan;
- mengunduh laporan `.xlsx`;
- mengelola service cleaning;
- mengelola user;
- memahami kondisi operasional toko tanpa harus menggunakan aplikasi POS mobile.

## 3. Scope

MVP:
- login;
- dashboard summary;
- transaction list/detail;
- reports;
- Excel export;
- service management;
- user management;
- basic settings.

Di luar scope MVP:
- membuat transaksi sebagai workflow utama;
- cleaning task execution;
- POS checkout penuh;
- multi-branch.

## 4. Technical Stack

- React
- Vite
- TypeScript
- React Router v7
- TanStack Query untuk server state
- Zustand untuk client/UI state yang memang diperlukan
- React Hook Form
- Zod atau validation layer setara
- Tailwind CSS v4 + ApexCharts (chart library dari template)
- Gunakan component UI yang sudah disediakan di `web-templates/src`
  (dipindahkan ke `web/src` saat scaffolding, ADR-0010), sesuaikan dengan kebutuhan

Hindari memasukkan state server ke Zustand bila TanStack Query sudah menangani kebutuhan tersebut.

## 5. Application Structure

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── transactions/
│   ├── reports/
│   ├── services/
│   ├── users/
│   └── settings/
├── layouts/
├── pages/
├── services/
├── hooks/
├── schemas/
└── utils/
```

Feature-first architecture wajib dipertahankan.

## 6. Routes

```text
/login
/dashboard
/transactions
/transactions/:id
/reports
/services
/services/new
/services/:id/edit
/users
/users/new
/users/:id/edit
/settings
```

Semua route selain `/login` membutuhkan authentication.

## 7. Role Behavior

### OWNER
Akses penuh.

### ADMIN
Akses dashboard, transactions, reports, dan service management sesuai policy.
Tidak boleh mengelola OWNER.

### CASHIER
MVP dapat diarahkan ke mobile dan tidak perlu akses dashboard penuh.

## 8. Authentication UX

Login field:
- username (identifier sesuai backend, ADR-0003);
- password.

State:
- loading;
- invalid credentials;
- server error;
- authenticated.

Mekanisme: Sanctum PAT (ADR-0003) — token disimpan client-side oleh API
client abstraction (`services/api.ts`), dikirim sebagai Bearer header.
Tanpa refresh endpoint; 401 → logout/redirect login.

Session harus tetap valid setelah refresh browser.

## 9. Main Layout

Layout:

```text
Header
├── user menu
└── logout

Sidebar
├── Dashboard
├── Transactions
├── Reports
├── Services
├── Users
└── Settings

Main content
└── page
```

Sidebar item harus disembunyikan jika role tidak memiliki akses.

## 10. Dashboard Page

### KPI cards
- revenue hari ini (basis tanggal order, ADR-0005);
- jumlah order hari ini;
- order in progress;
- ready for pickup;
- outstanding payment.

Setiap KPI revenue menampilkan breakdown payment status
(UNPAID/PARTIAL/PAID) sebagai dimensi.

### Charts
- revenue by day;
- orders by day;
- top services;
- payment methods (basis penerimaan payment — label copy harus mencantumkan
  "berdasarkan pembayaran diterima", ADR-0005).

### Filters
- today;
- 7 days;
- 30 days;
- custom date range.

Dashboard harus menangani empty state dan data loading.

## 11. Transaction List

Table minimum:

```text
Order Number
Customer
Item Count
Total
Payment Status
Order Status
Created At
Action
```

Fitur:
- pagination (offset, ADR-0011);
- search order number/customer;
- filter date;
- filter payment status;
- filter order status;
- sort tanggal.

Jangan mengambil seluruh transaksi sekaligus.

## 12. Transaction Detail

Tampilkan:
- order number;
- customer;
- created date;
- list sepatu;
- service setiap sepatu;
- foto before/after bila tersedia;
- subtotal;
- discount (nama master discount + nilai, ADR-0004);
- total;
- payment history;
- payment status;
- order status;
- status history;
- notes.

Order immutable (ADR-0004): dashboard tidak mengubah item/service/discount/
total — hanya dapat mengubah notes dan status via endpoint backend.

Dashboard tidak boleh mengubah status dengan cara mengubah field lokal lalu menganggap sukses. Gunakan endpoint backend dan refresh query setelah sukses.

Perubahan status di UI mengikuti transition matrix (ADR-0001): tampilkan
hanya aksi status yang legal dari status saat ini; `COMPLETED` butuh PAID,
`CANCELLED` butuh refund record bila sudah ada payment.

## 13. Reports

Page `/reports` memiliki report type:

1. Transactions
2. Revenue
3. Services
4. Customers

### Filter umum
- start date;
- end date;
- optional service;
- optional payment method;
- optional payment status.

### Actions
- view report;
- export XLSX.

## 14. Excel Export UX

Flow:

```text
Select filter
→ Click Export Excel
→ Show processing state
→ Backend queue generates file
→ Poll export status (GET /reports/exports/{id})
→ Show Download button
```

State:
- PENDING;
- PROCESSING;
- COMPLETED;
- FAILED.

Riwayat export tersedia via `GET /reports/exports` (daftar export milik
user, sesuai prd-backend.md §21).

Jangan memblok UI dengan request HTTP panjang untuk file besar.

## 15. Service Management

### Service list
Kolom:
- name;
- category;
- price;
- duration;
- status;
- updated at;
- action.

### Create/Edit form
Field:
- name;
- category;
- description;
- price (input rupiah integer, tanpa desimal, ADR-0004);
- estimated duration;
- active.

Validation:
- name required;
- price >= 0 (integer);
- category valid;
- duration valid.

### Delete
Jika service pernah digunakan transaksi, UI menggunakan deactivate/disable, bukan hard delete.

### Price change warning
Saat harga diubah, tampilkan confirmation bahwa harga baru hanya berlaku untuk order baru (snapshot harga pada order lama tidak berubah, ADR-0004).

## 16. User Management

Table:
- name;
- username (identifier, ADR-0003);
- role;
- status;
- last login;
- created at.

Create user:
- name;
- username;
- role;
- password.
Email opsional (tidak dipakai untuk login).

Action:
- edit;
- activate/deactivate (deactivate mencabut semua token user, ADR-0003);
- reset credentials sesuai backend policy.

Owner tidak boleh dihapus oleh admin.

## 17. Settings

Owner-only. Terhubung ke `GET/PUT /settings` (prd-backend.md §20a).

MVP minimal:
- store name;
- store phone;
- address;
- receipt footer;
- timezone (default Asia/Jakarta);
- notification configuration status (kesehatan kanal WhatsApp Cloud API,
  termasuk ringkasan status kirim FAILED, ADR-0006).

Settings bisnis tidak boleh dibaca dari environment frontend untuk data yang harus bisa diubah Owner.

## 18. Data Fetching

Gunakan TanStack Query untuk:
- dashboard queries;
- transaction queries;
- service queries;
- user queries;
- report queries.

Pattern:
- query key stabil;
- mutation invalidates related queries;
- loading state;
- error state;
- empty state.

## 19. API Layer

Buat satu API client abstraction.

Contoh konseptual:

```text
services/api.ts
services/authApi.ts
services/orderApi.ts
services/reportApi.ts
services/serviceApi.ts
services/userApi.ts
```

Jangan melakukan fetch langsung di banyak component.

## 20. UX Requirements

- Desktop-first karena target Owner menggunakan browser/desktop.
- Tetap usable dan responsive pada mobile dan tablet.
- Navigasi jelas.
- Feedback sukses/gagal untuk mutation.
- Confirmation untuk aksi destructive.
- Loading skeleton/spinner yang proporsional.
- Tidak kehilangan filter saat pagination.
- Date/time ditampilkan dalam timezone `Asia/Jakarta`.
- Currency default: IDR, format rupiah integer (tanpa desimal, ADR-0004).
- UI copy Bahasa Indonesia; pesan error user-facing Bahasa Indonesia dan
  actionable — mapping field error API → teks Indonesia dilakukan di
  client (ADR-0012).
- Label status/kontrak dari backend dirender melalui label map typed
  constants (bukan hard-coded string bebas).

## 21. Accessibility

- Keyboard navigation dasar harus berfungsi.
- Form memiliki label.
- Error input terasosiasi dengan field.
- Contrast memadai.
- Button memiliki state disabled saat mutation berjalan.

## 22. Error Handling

Mapping minimal:
- 401 → logout/redirect login;
- 403 → forbidden state;
- 404 → not found;
- 409 → conflict message;
- 422 → field validation error;
- 429 → rate limit message;
- 5xx → generic server error.

## 23. Security Rules

- Token/session tidak ditulis ke console log.
- Jangan menyimpan password di browser state.
- Permission berasal dari backend.
- Jangan mengandalkan hide menu sebagai security.
- Jangan expose secret API key di Vite env jika key tersebut bersifat private.

## 24. Testing

Unit/component test:
- form validation;
- table formatting;
- permission rendering.

Integration/E2E:
- login;
- dashboard loading;
- transaction search/filter;
- service create/edit/deactivate;
- user create/edit;
- report filter;
- Excel export flow.

## 25. Definition of Done

Web dianggap selesai untuk MVP jika:
- login berjalan;
- protected route berjalan;
- dashboard menampilkan data backend;
- transaction list/detail berjalan;
- service CRUD berjalan;
- user management berjalan;
- report berjalan;
- export XLSX berjalan melalui asynchronous job;
- authorization UI mengikuti backend;
- error/loading/empty states ditangani;
- build production berhasil;
- seluruh API yang digunakan terdokumentasi.

## 26. AI Agent Implementation Rules

AI Agent wajib:
1. membaca `prd-backend.md` dan ADR terkait (`docs/adr/`) sebagai kontrak API sebelum mengimplementasikan frontend;
2. tidak menambah endpoint backend baru hanya untuk mempermudah UI tanpa memperbarui backend spec;
3. memakai TanStack Query untuk server state;
4. memakai typed API response;
5. tidak meng-hard-code harga/service/status yang seharusnya berasal dari backend;
6. tidak menggunakan mock sebagai source of truth setelah endpoint tersedia;
7. menjaga responsive dan accessibility dasar;
8. setiap feature harus memiliki loading/error/empty/success state;
9. menguji permission untuk role yang relevan;
10. tidak melakukan perubahan desain global tanpa alasan dan konsistensi;
11. UI copy Bahasa Indonesia sesuai ADR-0012.
