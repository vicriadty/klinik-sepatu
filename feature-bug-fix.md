BUG DAN FIX


/web
- tambahkan modal konfirmasi logout
- fix warna content saat diubah ke darkmode
- custom filter pada semua fitur gunakan date picker
- untuk tombol aksi gunakan icon yang tersedia di /src/icons/
    - aksi ubah
    - aksi hapus
    - aksi detail
    - aksi tambah
- aksi tambah data dan edit data gunakan form in modal (jangan redirect ke halaman lain)
- aksi hapus gunakan konfirmasi modal sebelum dihapus
- gunakan alert setiap aksi yang berhasil atau gagal, gunakan yang tersedia di /src/components/ui/alert

Eksekusi beberapa perbaikan pada web dashboard, tetap di branch ini.
- pada mode darkmode, warna content juga berubah dengan menyesuaikan kontrast
- tombol tambah layanan juga menggunakan icon yang tersedia di /src/icons/  {icon} Tambah Layanan
- tombol tambah pengguna juga menggunakan icon yang tersedia di /src/icons/  {icon} Tambah User
- pada data table, aksi nonaktifkan/aktifkan juga menggunakan icon yang tersedia di /src/icons/
- setiap user mengklik tombol nonaktifkan/aktifkan, munculkan dialog konfirmasi sebelum diubah status
