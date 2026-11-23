# SalesSense — Portfolio Proyek Data & AI

**Program:** IBM SkillsBuild University Education × Hacktiv8, November 2026  
**Pengembang:** Raden Dimas Taufik Rahmat — Universitas Siber Asia

SalesSense adalah dashboard analisis penjualan interaktif dengan **4 KPI**, **10 grafik**, **4 filter**, ekspor CSV, serta **Insight Agent berbasis aturan** yang menjawab pertanyaan penjualan sederhana. Proyek menggunakan **198 transaksi valid** dari dataset workshop dengan dokumentasi validasi data.

**Batasan penting:** fitur Insight Agent adalah prototipe *rule-based* yang menampilkan alur Observe–Plan–Analyze–Respond. Proyek ini belum memakai API IBM Granite, watsonx, atau model LLM sungguhan. IBM Bob dipakai untuk review serta penyempurnaan proyek.

## Menjalankan aplikasi

Buka PowerShell pada folder proyek:

```powershell
py -m http.server 8080
```

Kemudian buka `http://localhost:8080/`, pilih **Insight Agent**, dan coba pertanyaan `Wilayah dengan revenue tertinggi?`.

## Publikasi GitHub Pages

Buat repositori publik bernama `salessense-sales-intelligence` melalui GitHub. Unggah seluruh **isi folder hasil ekstraksi ZIP** ke root repository (jangan unggah ZIP mentah). Buka **Settings → Pages → Deploy from a branch → main / (root)**. Setelah deployment berhasil, demo tersedia di `https://radenalta.github.io/salessense-sales-intelligence/`.

Baca [README utama](README.md) untuk fitur, data provenance, pengujian, dan batasan secara lengkap.
