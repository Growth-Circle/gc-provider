# Production Disk Safety

SERVER INI ADALAH SERVER PRODUCTION ACTIVE DAN DIPAKAI OLEH RIBUAN MEMBER.

## Rule utama

- Jangan pernah menghapus data, memformat VM/disk, menjalankan `mkfs`, `wipefs`, repartition, atau operasi destruktif storage lain tanpa persetujuan eksplisit dari Rama.
- Permintaan seperti “cek”, “lihat”, “bisa atur?”, atau “apakah bisa?” adalah izin untuk inspeksi read-only saja, bukan izin melakukan perubahan.
- Sebelum perubahan storage production: jelaskan dampak, risiko, rollback, dan minta approval eksplisit tertulis.

## Jika perlu migrasi disk, gunakan jalur aman

1. Identifikasi disk lama dan disk baru secara read-only (`lsblk`, `blkid`, `findmnt`, `df`).
2. Pastikan target migrasi adalah disk baru/kosong dan bukan disk production aktif.
3. Jika disk baru perlu filesystem, format hanya disk baru setelah approval eksplisit.
4. Mount disk baru ke path sementara, misalnya `/mnt/gclaw-ssd-new`.
5. Sinkronkan data dengan `rsync -aHAX --numeric-ids` dari mount lama ke mount baru.
6. Stop service terkait sesingkat mungkin untuk final sync agar data konsisten.
7. Jalankan final `rsync`, lalu switch mount `/srv/gclaw` ke disk baru via `/etc/fstab`.
8. Start service dan verifikasi health/heartbeat.
9. Simpan disk lama sebagai rollback sampai Rama menyetujui pembersihan.

Default aman: read-only dulu, backup dulu, approval eksplisit dulu.
