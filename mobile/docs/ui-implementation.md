# Mobile UI Implementation Standard — Klinik Sepatu POS

Dokumen ini adalah standar kerja AI Agent untuk mengimplementasikan desain mobile dari file JPEG/Pencil canvas ke project React Native. Setiap kali diminta mengimplementasikan satu screen, AI Agent **wajib membaca dokumen ini terlebih dahulu** sebelum mengubah kode.

> Prinsip utama: **desain adalah sumber kebenaran visual, codebase adalah sumber kebenaran behavior.** Jangan sampai desain rapi, logic ikut amnesia.

---

## 1. Tujuan Dokumen

Dokumen ini mengatur workflow agar implementasi UI dilakukan secara bertahap, konsisten, dan aman untuk project React Native.

Target workflow:

1. Implementasi dilakukan **satu screen per task**.
2. Agent membaca desain JPEG/Pencil sesuai screen yang diminta.
3. Agent membaca struktur project dan logic existing sebelum coding.
4. Agent memakai design token dan reusable component.
5. Agent tidak mengubah business logic, API contract, auth flow, atau navigation behavior tanpa alasan kuat.
6. Agent menjalankan check setelah implementasi.
7. Agent memperbarui tracker implementasi di dokumen ini.

---

## 2. Design Source

Desain mobile berasal dari JPEG hasil canvas pen.dev/Pencil. Simpan file desain di repo dengan struktur yang direkomendasikan:

```text
/docs/design/mobile/
├── bottom-navigation-bar.jpg
├── splash-screen-mobile.jpg
├── pos-login-mobile.jpg
├── pos-home-mobile.jpg
├── pos-orders-mobile.jpg
├── pos-order-detail-ord-20260921-0008.jpg
├── pos-payment-order-0008.jpg
├── pos-customers-search.jpg
├── pos-customer-create.jpg
├── pos-new-order-01-customer.jpg
├── pos-new-order-02-shoes.jpg
├── pos-new-order-03-services.jpg
├── pos-new-order-04-photos.jpg
├── pos-new-order-05-review.jpg
└── pos-order-created-success.jpg
```

Jika file JPEG belum ada di repo, cari desain melalui MCP Pencil/pen.dev. Jika desain masih tidak ditemukan, hentikan implementasi screen tersebut dan minta user menyediakan file desain yang sesuai.

### Ukuran Desain

Mayoritas screenshot memiliki ukuran `780 x 1688 px`, setara kira-kira dengan logical mobile size `390 x 844 dp` pada skala `@2x`.

Saat mengonversi ukuran:

```text
nilai dp ≈ nilai pixel screenshot / 2
```

Contoh:

```text
margin kiri 40 px pada JPEG ≈ 20 dp di React Native
button tinggi 120 px pada JPEG ≈ 60 dp di React Native
```

Gunakan ukuran ini sebagai acuan, bukan angka mati. UI tetap harus responsif di berbagai ukuran layar.

---

## 3. Daftar Screen dan File Desain

| Screen | Design file | Route/screen target |
|---|---|---|
| Splash / Loading | `splash-screen-mobile.jpg` | `SplashScreen` / loading state |
| Login | `pos-login-mobile.jpg` | `LoginScreen` |
| Home / Beranda | `pos-home-mobile.jpg` | `HomeScreen` |
| Orders List / Pesanan | `pos-orders-mobile.jpg` | `OrdersScreen` |
| Order Detail | `pos-order-detail-ord-20260921-0008.jpg` | `OrderDetailScreen` |
| Payment | `pos-payment-order-0008.jpg` | `PaymentScreen` |
| Customers Search / Pelanggan | `pos-customers-search.jpg` | `CustomersScreen` / `CustomerSearchScreen` |
| Customer Create | `pos-customer-create.jpg` | `CustomerCreateScreen` |
| New Order Step 1 — Customer | `pos-new-order-01-customer.jpg` | `NewOrderCustomerStepScreen` |
| New Order Step 2 — Shoes | `pos-new-order-02-shoes.jpg` | `NewOrderShoesStepScreen` |
| New Order Step 3 — Services | `pos-new-order-03-services.jpg` | `NewOrderServicesStepScreen` |
| New Order Step 4 — Photos | `pos-new-order-04-photos.jpg` | `NewOrderPhotosStepScreen` |
| New Order Step 5 — Review | `pos-new-order-05-review.jpg` | `NewOrderReviewStepScreen` |
| Order Created Success | `pos-order-created-success.jpg` | `OrderCreatedSuccessScreen` |
| Bottom Navigation | `bottom-navigation-bar.jpg` | `BottomTabBar` / app tab navigator |

Route/screen target boleh disesuaikan dengan nama yang sudah ada di project, tetapi mapping desainnya harus tetap jelas.

---

## 4. Urutan Implementasi yang Direkomendasikan

Implementasi harus dilakukan dari fondasi ke screen kompleks:

```text
1. Design tokens
2. Shared UI components
3. Bottom navigation
4. Splash screen
5. Login screen
6. Home screen
7. Customers search
8. Customer create
9. Orders list
10. Order detail
11. Payment
12. New order step 1
13. New order step 2
14. New order step 3
15. New order step 4
16. New order step 5
17. Order created success
```

Jika user meminta screen tertentu lebih dulu, agent boleh mengimplementasikan screen tersebut, tetapi tetap wajib membuat/memakai shared components yang relevan.

---

## 5. Aturan Utama Untuk AI Agent

### 5.1 Wajib Dilakukan

Sebelum coding, agent harus:

1. Membaca dokumen ini.
2. Membaca file desain JPEG yang sesuai.
3. Membaca screen existing yang akan diubah.
4. Membaca navigation existing.
5. Membaca service/API/hook terkait screen tersebut.
6. Mengidentifikasi reusable component yang sudah ada.
7. Membuat rencana singkat file yang akan diubah.

Saat coding, agent harus:

1. Menggunakan token dari `src/theme` bila tersedia.
2. Membuat token jika belum tersedia.
3. Menggunakan reusable component bila tersedia.
4. Membuat reusable component baru jika pola muncul lebih dari satu screen.
5. Memisahkan UI dan logic.
6. Menjaga behavior existing.
7. Menjaga responsive layout, safe area, keyboard handling, loading, empty, dan error state.

Setelah coding, agent harus:

1. Menjalankan TypeScript check jika tersedia.
2. Menjalankan lint jika tersedia.
3. Menjalankan test jika tersedia dan relevan.
4. Memperbaiki error yang muncul.
5. Melaporkan file yang diubah.
6. Melaporkan gap visual/behavior jika ada.
7. Memperbarui tracker di bagian akhir dokumen ini.

### 5.2 Dilarang Dilakukan

Agent tidak boleh:

1. Mengimplementasikan semua screen sekaligus kecuali user meminta eksplisit.
2. Mengubah API contract tanpa persetujuan.
3. Mengubah auth flow tanpa persetujuan.
4. Mengubah struktur database/backend tanpa persetujuan.
5. Mengganti navigation library tanpa persetujuan.
6. Menambahkan UI library baru tanpa persetujuan.
7. Menghapus file existing tanpa alasan jelas.
8. Meng-hardcode warna, radius, spacing, atau typography berulang di banyak file.
9. Membuat mock logic permanen di production code.
10. Mengabaikan error TypeScript/lint.
11. Mengimplementasikan status bar palsu jika app sudah memakai status bar native.

---

## 6. Folder Structure Rekomendasi

Sesuaikan dengan struktur project existing. Jika belum ada struktur yang jelas, gunakan struktur berikut:

```text
src/
├── assets/
│   ├── images/
│   └── icons/
│
├── components/
│   ├── ui/
│   │   ├── AppButton.tsx
│   │   ├── AppTextInput.tsx
│   │   ├── AppCard.tsx
│   │   ├── AppBadge.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AppSearchInput.tsx
│   │   ├── AppStepper.tsx
│   │   ├── AppEmptyState.tsx
│   │   ├── AppLoadingState.tsx
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── Screen.tsx
│   │   ├── FixedBottomAction.tsx
│   │   └── SafeKeyboardView.tsx
│   │
│   ├── navigation/
│   │   └── BottomTabBar.tsx
│   │
│   ├── order/
│   │   ├── OrderCard.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   ├── PaymentStatusBadge.tsx
│   │   ├── ShoeSummaryCard.tsx
│   │   └── ServiceOptionCard.tsx
│   │
│   └── customer/
│       ├── CustomerCard.tsx
│       └── CustomerMiniCard.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useCustomers.ts
│   ├── useOrders.ts
│   └── useNewOrderDraft.ts
│
├── navigation/
│   ├── AppNavigator.tsx
│   └── types.ts
│
├── screens/
│   ├── auth/
│   │   └── LoginScreen.tsx
│   ├── home/
│   │   └── HomeScreen.tsx
│   ├── customers/
│   │   ├── CustomersScreen.tsx
│   │   └── CustomerCreateScreen.tsx
│   ├── orders/
│   │   ├── OrdersScreen.tsx
│   │   ├── OrderDetailScreen.tsx
│   │   ├── PaymentScreen.tsx
│   │   ├── OrderCreatedSuccessScreen.tsx
│   │   └── new-order/
│   │       ├── NewOrderCustomerStepScreen.tsx
│   │       ├── NewOrderShoesStepScreen.tsx
│   │       ├── NewOrderServicesStepScreen.tsx
│   │       ├── NewOrderPhotosStepScreen.tsx
│   │       └── NewOrderReviewStepScreen.tsx
│   └── splash/
│       └── SplashScreen.tsx
│
├── services/
│   ├── authService.ts
│   ├── customerService.ts
│   ├── orderService.ts
│   └── paymentService.ts
│
└── theme/
    ├── colors.ts
    ├── spacing.ts
    ├── radius.ts
    ├── typography.ts
    ├── shadows.ts
    └── index.ts
```

Jangan memaksakan struktur ini jika project sudah punya pola yang lebih matang. Ikuti pola existing lebih dulu.

---

## 7. Design Token Standard

Agent harus membuat atau menyesuaikan token berikut.

### 7.1 Colors

Gunakan nama semantik, bukan nama warna mentah.

```ts
export const colors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',

  textPrimary: '#171717',
  textSecondary: '#6B6B6B',
  textMuted: '#8A8A8A',
  textInverse: '#FFFFFF',

  border: '#E5E5E5',
  borderStrong: '#171717',
  borderFocus: '#007AFF',

  primary: '#171717',
  primaryPressed: '#000000',

  success: '#2F9E69',
  successSoft: '#EAF7F0',

  info: '#0A84FF',
  infoSoft: '#EAF3FF',

  warning: '#D98200',
  warningSoft: '#FFF4E5',

  danger: '#FF5A5F',
  dangerSoft: '#FFECEC',

  disabled: '#CFCFCF',
};
```

Warna boleh disesuaikan setelah dibandingkan langsung dengan desain JPEG. Konsistensi lebih penting daripada banyak variasi warna.

### 7.2 Spacing

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};
```

Acuan umum dari desain:

```text
screen horizontal padding: 20 dp
jarak antar section besar: 28–32 dp
jarak antar card/list item: 8–12 dp
jarak label ke input: 8–12 dp
```

### 7.3 Radius

```ts
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};
```

Acuan desain:

```text
input/card umum: 8–12 dp
button utama: 6–8 dp
bottom navigation container: pill / 999
badge: pill / 999
avatar: circle
```

### 7.4 Typography

Gunakan font project existing. Jika project belum punya custom font, gunakan system font React Native.

Acuan ukuran:

```ts
export const typography = {
  titleLarge: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  titleMedium: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  titleSmall: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '400',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
};
```

Acuan desain:

```text
judul screen: bold besar
subtitle: abu-abu
section label: uppercase + letter spacing
angka total/harga: bold
nomor order: monospace atau semi-monospace jika tersedia
```

### 7.5 Shadows

Desain dominan memakai border tipis, bukan shadow berat. Gunakan shadow minimal.

```ts
export const shadows = {
  none: {},
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
};
```

---

## 8. Shared Component Standard

### 8.1 Screen Wrapper

Semua screen harus memakai wrapper yang menangani:

1. Safe area.
2. Background color.
3. Horizontal padding.
4. Scroll behavior.
5. Keyboard avoiding jika ada input.
6. Fixed bottom action jika diperlukan.

Nama rekomendasi: `Screen`.

Fitur minimal:

```ts
type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  withBottomTabs?: boolean;
  keyboardAvoiding?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};
```

### 8.2 AppHeader

Digunakan untuk screen dengan judul dan tombol kembali.

Varian:

1. `back + title + subtitle`
2. `title + subtitle + right action`
3. `title only`

Contoh screen:

```text
Pelanggan baru
Pesanan baru
Detail pesanan
Pembayaran
```

### 8.3 AppButton

Varian wajib:

```text
primary: background hitam, text putih
secondary/outline: background putih, border hitam, text hitam
ghost/link: background transparan, text biru/abu-abu
danger ghost: text merah
```

State wajib:

```text
default
pressed
loading
disabled
```

### 8.4 AppTextInput

Harus mendukung:

```text
label uppercase
left icon
right icon/action
placeholder
value
error state
focused state blue border
helper text
keyboard type
secure text entry
```

Dipakai untuk:

```text
username
password
nama pelanggan
nomor HP
search pelanggan
search pesanan
jumlah dibayar
```

### 8.5 AppCard

Card umum untuk:

```text
summary card
customer card
order card
shoe card
service option card
payment method card
info banner
```

Default style:

```text
background putih
border #E5E5E5
radius 8–12
padding 14–16
```

### 8.6 Badge

Varian status:

```text
DITERIMA: blue
DIPROSES: black
SIAP DIAMBIL: green
SELESAI: gray
BELUM DIBAYAR: warning soft
LUNAS: green text
SEBAGIAN: warning text
```

Gunakan komponen `OrderStatusBadge` dan `PaymentStatusBadge`, bukan styling status manual di tiap screen.

### 8.7 BottomTabBar

Berdasarkan `bottom-navigation-bar.jpg` dan screen utama.

Tab:

```text
Beranda
Pesanan
Pelanggan
Profil
```

Acuan visual:

```text
container floating di bawah
background putih
border tipis
radius pill
active tab memiliki background abu-abu muda berbentuk pill
active icon/text hitam
inactive icon/text abu-abu
```

Agent harus memakai navigator existing. Jika project menggunakan React Navigation, implementasikan custom tab bar tanpa mengganti library.

### 8.8 New Order Stepper

Digunakan untuk flow `Pesanan baru` langkah 1–5.

Step:

```text
1 Pelanggan
2 Sepatu
3 Layanan
4 Foto
5 Review
```

State:

```text
completed: lingkaran hijau dengan check
active: lingkaran hitam dengan angka
upcoming: lingkaran putih border abu-abu dengan angka
connector completed: hijau
connector upcoming: abu-abu
```

Jadikan component reusable: `NewOrderStepper` atau `AppStepper`.

---

## 9. Screen-Specific Notes

### 9.1 Splash / Loading

Design file: `splash-screen-mobile.jpg`

Elemen:

```text
logo di tengah layar
teks Loading... di bawah logo
background putih/nyaris putih
```

Aturan:

1. Gunakan loading state dari auth/bootstrap existing.
2. Jangan membuat delay palsu kecuali sudah ada kebutuhan UX.
3. Setelah session dicek, arahkan ke Login atau Main App sesuai logic existing.

---

### 9.2 Login

Design file: `pos-login-mobile.jpg`

Elemen:

```text
logo Klinik Sepatu di area atas
judul: Masuk ke Klinik Sepatu
subtitle: Kelola penerimaan dan pembayaran dengan cepat.
input username
input kata sandi dengan toggle visibility
button Masuk
info session restored
footer: KLINIK SEPATU POS • v1.0.0
```

Aturan:

1. Pertahankan auth logic existing.
2. Jangan hardcode credential.
3. Password visibility toggle harus lokal UI state.
4. Loading button harus muncul saat login request berjalan.
5. Error login harus ditampilkan dengan style konsisten.

---

### 9.3 Home / Beranda

Design file: `pos-home-mobile.jpg`

Elemen:

```text
greeting: Selamat pagi
nama user: Alya Pratama
role: KASIR
avatar inisial AP
Ringkasan hari ini: 4 summary cards
Aksi cepat: Pesanan baru, Cari pelanggan, Lihat semua pesanan
Pesanan terbaru: list ringkas
bottom navigation active Beranda
```

Aturan:

1. Nama, role, summary, dan pesanan terbaru harus berasal dari state/API existing jika tersedia.
2. Jika API belum tersedia, gunakan adapter/fixture sementara yang mudah dihapus, jangan menyebar mock data di UI.
3. Quick action harus memakai navigation route existing.
4. Card summary harus reusable.

---

### 9.4 Orders List / Pesanan

Design file: `pos-orders-mobile.jpg`

Elemen:

```text
judul Pesanan
subtitle jumlah pesanan aktif
button + Baru
search input
filter chips: Hari ini, Status, Pembayaran
section Daftar pesanan + sort label Terbaru
order cards
bottom navigation active Pesanan
```

Aturan:

1. Search harus memakai logic existing atau local state jika belum terhubung.
2. Filter chips boleh membuka bottom sheet/dropdown jika sudah ada pattern. Jika belum ada, implement UI dasar tanpa memaksakan library baru.
3. Order card harus reusable dan dipakai juga di Home bila sesuai.
4. Status dan payment status wajib memakai badge component.

---

### 9.5 Order Detail

Design file: `pos-order-detail-ord-20260921-0008.jpg`

Elemen:

```text
header Detail pesanan + nomor order
status badges
customer card dengan link Lihat pelanggan
item sepatu
foto before
subtotal/total
riwayat status
primary action Mulai diproses
note pembayaran
```

Aturan:

1. Detail harus membaca order berdasarkan route param.
2. Action button mengikuti status order.
3. Jangan mengubah state order langsung di UI tanpa service/API existing.
4. Foto before harus pakai thumbnail component dan fallback placeholder.

---

### 9.6 Payment

Design file: `pos-payment-order-0008.jpg`

Elemen:

```text
header Pembayaran + nomor order
total tagihan dark card
payment status badge
metode pembayaran: Tunai, QRIS, Transfer
QRIS toko info card
jumlah dibayar input
button Catat pembayaran
helper note
```

Aturan:

1. Payment method selection harus stateful.
2. Amount input harus numeric/currency friendly.
3. Status PAID/LUNAS hanya ditetapkan setelah API/service payment sukses.
4. Jangan menandai lunas hanya karena user menekan button tanpa response sukses.

---

### 9.7 Customers Search / Pelanggan

Design file: `pos-customers-search.jpg`

Elemen:

```text
header Pelanggan + subtitle Cari dan pilih pelanggan
button + Baru
search input focused
format tersimpan
hasil pencarian + jumlah pelanggan
customer list
info banner
bottom navigation active Pelanggan
```

Aturan:

1. Search pelanggan sebaiknya debounce jika memakai API.
2. Normalisasi nomor HP ke `+62` harus mengikuti service/backend existing.
3. Gunakan CustomerCard reusable.
4. Klik customer membuka detail/select customer sesuai konteks route.

---

### 9.8 Customer Create / Pelanggan Baru

Design file: `pos-customer-create.jpg`

Elemen:

```text
header Pelanggan baru + subtitle Data pelanggan
input nama
input nomor HP dengan error duplicate
warning banner Nomor sudah terdaftar + action Gunakan yang ada
format tersimpan card
server validation note
button Simpan pelanggan
secondary action Batal
```

Aturan:

1. Validasi nomor harus mengikuti backend/service jika tersedia.
2. Error duplicate harus menampilkan pilihan menggunakan customer existing.
3. Jangan hanya validasi client-side; server tetap final.
4. Button simpan disabled/loading sesuai state.

---

### 9.9 New Order Step 1 — Customer

Design file: `pos-new-order-01-customer.jpg`

Elemen:

```text
header Pesanan baru + subtitle Pelanggan
stepper langkah 1 dari 5
search pelanggan
selected customer card
button Tambah pelanggan baru
info note normalisasi nomor
text Draft tersimpan otomatis
button Lanjut: pilih sepatu
secondary Simpan draft
```

Aturan:

1. State customer terpilih masuk ke draft order.
2. Draft harus memakai logic existing jika sudah ada.
3. Jangan membuat order ke server pada step ini kecuali flow existing memang begitu.
4. CTA lanjut disabled jika belum ada customer valid.

---

### 9.10 New Order Step 2 — Shoes

Design file: `pos-new-order-02-shoes.jpg`

Elemen:

```text
header Pesanan baru + subtitle Sepatu
stepper langkah 2 dari 5
customer summary card
Daftar sepatu • 2 item
shoe cards
button Tambah sepatu
text Draft tersimpan otomatis
button Lanjut: pilih layanan
secondary Simpan draft
```

Aturan:

1. Shoe item harus bisa tambah/hapus/edit sesuai capability existing.
2. Minimal field sesuai desain: merek, model/nama, warna, jenis sepatu, catatan.
3. CTA lanjut disabled jika daftar sepatu kosong.
4. Jangan kehilangan data customer dari step sebelumnya.

---

### 9.11 New Order Step 3 — Services

Design file: `pos-new-order-03-services.jpg`

Elemen:

```text
header Pesanan baru + subtitle Layanan
stepper langkah 3 dari 5
tab Sepatu 1 / Sepatu 2
list service option
selected services with checkbox
subtotal sepatu
button Lanjut: ambil foto
secondary Simpan draft
```

Aturan:

1. Harga layanan berasal dari server/service jika tersedia.
2. Service selection disimpan per shoe item.
3. Subtotal dihitung dari layanan terpilih.
4. CTA lanjut disabled jika ada sepatu tanpa layanan.

---

### 9.12 New Order Step 4 — Photos

Design file: `pos-new-order-04-photos.jpg`

Elemen:

```text
header Pesanan baru + subtitle Foto kondisi
stepper langkah 4 dari 5
info card pengambilan foto before
checklist sudut foto
foto tersimpan 1/5
photo placeholders
row Tambah foto kerusakan opsional
upload note
button Lanjut: tinjau pesanan
secondary Simpan draft
```

Aturan:

1. Gunakan camera/image picker existing.
2. Minta permission sesuai platform jika belum ada.
3. Foto boleh disimpan lokal/draft dulu sesuai flow existing.
4. Upload ke server mengikuti aturan existing: desain menyebut foto diunggah setelah order berhasil dibuat.
5. Jangan mengirim foto sebelum waktunya jika backend flow belum mendukung.

---

### 9.13 New Order Step 5 — Review

Design file: `pos-new-order-05-review.jpg`

Elemen:

```text
header Pesanan baru + subtitle Review
stepper langkah 5 dari 5
customer summary
ringkasan pesanan per sepatu
diskon terdaftar dropdown
total card
server confirmation note
button Buat pesanan
secondary Simpan draft
```

Aturan:

1. Total lokal hanya estimasi sampai server mengonfirmasi.
2. Server adalah sumber kebenaran final untuk total, diskon, dan order number.
3. Setelah create order sukses, navigate ke success screen.
4. Jika gagal, tampilkan error tanpa menghapus draft.

---

### 9.14 Order Created Success

Design file: `pos-order-created-success.jpg`

Elemen:

```text
header Pesanan dibuat + subtitle Order berhasil disimpan
success icon besar
headline Pesanan dibuat
order summary card
button Lanjut ke pembayaran
button Lihat pesanan
link Pesanan baru
offline/payment note
```

Aturan:

1. Data order berasal dari response create order.
2. Button pembayaran membuka PaymentScreen dengan order id.
3. Button lihat pesanan membuka OrderDetailScreen.
4. Link pesanan baru reset draft dan mulai flow baru.

---

## 10. Navigation Rules

Agent harus membaca navigation existing sebelum mengubah route.

Rekomendasi navigasi umum:

```text
AuthStack
└── Login

MainTabs
├── Beranda
├── Pesanan
├── Pelanggan
└── Profil

OrdersStack
├── OrdersList
├── NewOrderCustomerStep
├── NewOrderShoesStep
├── NewOrderServicesStep
├── NewOrderPhotosStep
├── NewOrderReviewStep
├── OrderCreatedSuccess
├── OrderDetail
└── Payment

CustomersStack
├── CustomersSearch
└── CustomerCreate
```

Jika project hanya memakai satu root stack, ikuti struktur existing.

Aturan khusus:

1. Bottom tab hanya muncul di main tab screens.
2. Bottom tab tidak muncul di login, splash, new order flow, payment, dan detail jika desain tidak menampilkan tab.
3. Screen dengan back arrow harus memakai navigation back existing.
4. Jangan membuat route baru jika route existing sudah bisa dipakai.

---

## 11. State dan Data Rules

### 11.1 Data Source Priority

Urutan sumber data:

```text
1. API/service existing
2. Store/state management existing
3. Hook existing
4. Fixture sementara hanya jika belum ada backend/endpoint
```

Jika memakai fixture sementara:

1. Simpan di file jelas seperti `src/mocks/posFixtures.ts`.
2. Beri komentar `TODO: replace with API data`.
3. Jangan hardcode langsung di komponen screen.

### 11.2 Draft Order

Flow new order harus menjaga draft:

```text
customer
shoes[]
services per shoe
photos before/damage
selected discount
subtotal/total estimation
```

Jika project sudah punya store, gunakan store existing. Jika belum, buat hook/context minimal, misalnya:

```text
useNewOrderDraft
```

Jangan menyebar state draft ke banyak screen tanpa pola yang jelas.

### 11.3 Server Finality

Data berikut harus dianggap final dari server:

```text
order number
total final
discount final
payment status
order status
customer uniqueness
service price
```

UI boleh menghitung estimasi, tapi jangan menandai final sebelum response server sukses.

---

## 12. Icons and Assets

Desain memakai icon line style sederhana.

Icon yang muncul:

```text
home
clipboard/list
users
user
plus
search
x/close
back arrow
lock
eye
phone
calendar
package/box
clock
info
alert triangle
shield/check
camera
image
upload cloud
chevron right/down
cash/banknote
QR code
building/bank
check circle
```

Aturan:

1. Pakai icon library existing.
2. Jika belum ada, rekomendasi: `lucide-react-native`.
3. Jangan menambahkan library baru tanpa persetujuan user.
4. Icon size umum: 20–28 dp.
5. Icon inactive abu-abu, active hitam, warning orange, success green, info blue.

Logo Klinik Sepatu harus memakai asset existing. Jika belum tersedia, minta user menyediakan asset logo PNG/SVG, jangan menggambar ulang logo dari screenshot secara manual di code.

---

## 13. Responsive, Safe Area, Keyboard

Agent harus memastikan:

1. Konten tidak tertutup notch/status bar.
2. Konten tidak tertutup bottom navigation.
3. Konten dengan action bawah tidak tertutup home indicator.
4. Screen form memakai keyboard avoiding.
5. Input tetap terlihat saat keyboard muncul.
6. Long content memakai scroll.
7. Fixed bottom action tetap usable pada layar kecil.

Gunakan library existing seperti:

```text
react-native-safe-area-context
KeyboardAvoidingView
ScrollView
FlatList
```

Jangan membuat status bar custom seperti pada JPEG kecuali memang project membutuhkan mock device frame. JPEG menampilkan status bar sebagai konteks desain, bukan instruksi untuk membuat status bar palsu.

---

## 14. Implementation Workflow Per Screen

Setiap kali user meminta implementasi screen, agent harus mengikuti workflow ini.

### Step 1 — Read Instruction

Baca:

```text
docs/ui-implementation.md
```

### Step 2 — Locate Design

Cari design file berdasarkan mapping di bagian `Daftar Screen dan File Desain`.

Contoh:

```text
User request: implement Login screen
Design file: docs/design/mobile/pos-login-mobile.jpg
```

### Step 3 — Inspect Existing Code

Baca file terkait:

```text
navigation
screen existing
components existing
theme existing
hooks/services related
state management related
```

### Step 4 — Plan Before Coding

Tulis rencana singkat:

```text
Screen: Login
Design file: pos-login-mobile.jpg
Existing files checked:
- ...
Files to change:
- ...
Reusable components to use/create:
- ...
Behavior to preserve:
- ...
Risk:
- ...
```

### Step 5 — Implement

Aturan:

1. Implement hanya screen yang diminta.
2. Buat reusable component jika memang dibutuhkan.
3. Jangan ubah behavior tanpa alasan.
4. Jangan refactor besar-besaran.

### Step 6 — Run Checks

Deteksi package manager dan script yang tersedia.

Prioritas command:

```bash
npm run typecheck
npm run lint
npm test
```

Atau jika project memakai Yarn/PNPM/Bun:

```bash
yarn typecheck
yarn lint
yarn test

pnpm typecheck
pnpm lint
pnpm test

bun run typecheck
bun run lint
bun test
```

Jika script tidak tersedia, laporkan dengan jelas. Jangan mengarang hasil test.

### Step 7 — Visual Validation

Bandingkan hasil implementasi dengan JPEG:

```text
layout
spacing
alignment
typography
font weight
color
border radius
card/input/button dimensions
icon selection
safe area
scroll behavior
keyboard behavior
bottom fixed action
```

Jika agent bisa mengambil screenshot emulator/simulator, lakukan compare. Jika tidak bisa, sebutkan bahwa visual validation perlu dilakukan manual oleh user.

### Step 8 — Update Tracker

Update bagian `Implementation Tracker` di bawah ini.

### Step 9 — Report

Laporan akhir harus singkat dan jelas:

```text
Implemented: LoginScreen
Design source: pos-login-mobile.jpg
Files changed:
- ...
Checks:
- typecheck: passed/failed/not available
- lint: passed/failed/not available
Notes:
- ...
Next recommended screen:
- ...
```

---

## 15. Prompt Template Untuk User

Gunakan format prompt berikut saat meminta agent mengimplementasikan screen:

```text
Implement screen: <SCREEN_NAME>

Read docs/ui-implementation.md first and follow the workflow strictly.
Use the matching JPEG design from docs/design/mobile.
Implement only this screen and required reusable components.
Preserve existing business logic, API contracts, navigation behavior, and state management.
Run available checks after implementation.
Update the implementation tracker in docs/ui-implementation.md.
```

Contoh:

```text
Implement screen: Login

Read docs/ui-implementation.md first and follow the workflow strictly.
Use docs/design/mobile/pos-login-mobile.jpg as the visual source.
Implement only this screen and required reusable components.
Preserve the existing auth logic.
Run available checks after implementation.
Update the implementation tracker in docs/ui-implementation.md.
```

---

## 16. Acceptance Checklist

Screen dianggap selesai jika:

```text
[ ] File desain yang tepat sudah digunakan.
[ ] UI mengikuti layout utama desain.
[ ] Warna memakai theme token.
[ ] Typography memakai theme token/style reusable.
[ ] Spacing dan radius konsisten.
[ ] Component reusable dipakai bila ada.
[ ] Tidak ada hardcode berulang yang seharusnya menjadi token.
[ ] Logic existing tidak rusak.
[ ] Navigation berjalan.
[ ] Loading state tersedia jika diperlukan.
[ ] Error state tersedia jika diperlukan.
[ ] Empty state tersedia jika diperlukan.
[ ] Keyboard handling aman untuk form.
[ ] Safe area aman.
[ ] TypeScript check dijalankan atau dilaporkan tidak tersedia.
[ ] Lint dijalankan atau dilaporkan tidak tersedia.
[ ] Tracker diperbarui.
```

---

## 17. Implementation Tracker

Update status setiap kali screen selesai.

Status:

```text
TODO
IN_PROGRESS
DONE
BLOCKED
```

| Area | Item | Design source | Status | Notes |
|---|---|---|---|---|
| Foundation | Design tokens | all JPEG | TODO | colors, spacing, radius, typography, shadows |
| Foundation | Screen wrapper | all JPEG | TODO | safe area, scroll, keyboard, fixed bottom action |
| Components | AppHeader | multiple | TODO | back, title, subtitle, right action |
| Components | AppButton | multiple | TODO | primary, outline, ghost, loading, disabled |
| Components | AppTextInput | multiple | TODO | label, icon, focus, error, helper |
| Components | AppCard | multiple | TODO | base card pattern |
| Components | Badge components | orders/detail/payment | TODO | order status + payment status |
| Components | BottomTabBar | `bottom-navigation-bar.jpg` | DONE | Beranda, Pesanan, Pelanggan, Profil; Profil is visually present and disabled until its route exists |
| Components | NewOrderStepper | new order step 1–5 | TODO | 5-step progress |
| Screen | SplashScreen | `splash-screen-mobile.jpg` | DONE | restoring state via RootNavigator; native splash remains configured in app.json |
| Screen | LoginScreen | `pos-login-mobile.jpg` | DONE | auth logic, loading, validation, API errors, and session navigation preserved |
| Screen | HomeScreen | `pos-home-mobile.jpg` | DONE | greeting/avatar, summary cards, quick actions, recent orders, loading/error/empty states |
| Screen | OrdersScreen | `pos-orders-mobile.jpg` | DONE | header, search, filters, order list, pagination, loading/error/empty states |
| Screen | OrderDetailScreen | `pos-order-detail-ord-20260921-0008.jpg` | DONE | detail header, customer/items, before photos, totals, status timeline, actions, loading/error states |
| Screen | PaymentScreen | `pos-payment-order-0008.jpg` | DONE | payment header, due summary, methods, QRIS guidance, amount, record payment, paid/cancelled/history states |
| Screen | CustomersScreen | `pos-customers-search.jpg` | DONE | search, normalized phone preview, result cards, select mode, duplicate guidance, loading/error/empty states |
| Screen | CustomerCreateScreen | `pos-customer-create.jpg` | DONE | labeled fields, normalized phone card, duplicate warning/action, server validation note, save/cancel states |
| Screen | NewOrderCustomerStepScreen | `pos-new-order-01-customer.jpg` | DONE | stepper, inline customer search/select, add customer action, phone normalization note, draft persistence, guarded next step |
| Screen | NewOrderShoesStepScreen | `pos-new-order-02-shoes.jpg` | DONE | shoe summary cards, add/edit/delete/photo actions, customer summary, draft persistence, guarded service continuation |
| Screen | NewOrderServicesStepScreen | `pos-new-order-03-services.jpg` | TODO | services per shoe |
| Screen | NewOrderPhotosStepScreen | `pos-new-order-04-photos.jpg` | TODO | before photos |
| Screen | NewOrderReviewStepScreen | `pos-new-order-05-review.jpg` | TODO | review total and create order |
| Screen | OrderCreatedSuccessScreen | `pos-order-created-success.jpg` | TODO | success actions |

---

## 18. Definition of Done Per Task

Satu task implementasi screen dinyatakan selesai jika agent memberikan laporan seperti ini:

```text
Implemented: <ScreenName>
Design source: <file-name>.jpg

Files changed:
- <file>
- <file>

Checks:
- typecheck: passed / failed / not available
- lint: passed / failed / not available
- test: passed / failed / not available

Visual validation:
- matched: <main parts>
- differences: <known gaps, if any>

Behavior preserved:
- <auth/navigation/API/state notes>

Tracker updated: yes/no
Next recommended screen: <ScreenName>
```

Jika ada check yang gagal, agent tidak boleh menyebut task selesai tanpa menjelaskan error dan langkah perbaikannya.

---

## 19. Rollback and Commit Rule

Rekomendasi commit:

```bash
git add .
git commit -m "feat(ui): implement <screen-name> screen"
```

Contoh:

```bash
git commit -m "feat(ui): implement login screen"
git commit -m "feat(ui): implement home screen"
git commit -m "feat(ui): implement new order customer step"
```

Satu screen sebaiknya satu commit. Jika agent mengubah terlalu banyak file tanpa alasan, hentikan dan review diff terlebih dahulu.

---

## 20. Final Reminder For Agent

Saat menerima perintah implementasi screen:

```text
Read this document.
Find the correct JPEG.
Inspect existing code.
Plan.
Implement only the requested screen.
Preserve behavior.
Run checks.
Update tracker.
Report clearly.
```

Jangan jadi agent yang "sekalian refactor seluruh dunia". Fokus satu screen, rapi, bisa dites, bisa rollback.
