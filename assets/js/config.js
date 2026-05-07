/**
 * ===================================================================
 * KONFIGURASI APLIKASI
 * ===================================================================
 * ⚠️ GANTI API_URL setelah Anda deploy Google Apps Script.
 * Cara mendapatkan URL:
 * 1. Buka Apps Script project Anda
 * 2. Klik Deploy > New Deployment > Web App
 * 3. Execute as: Me  |  Who has access: Anyone
 * 4. Copy "Web app URL" (formatnya: https://script.google.com/macros/s/XXXX/exec)
 * 5. Paste di bawah ini
 * ===================================================================
 */

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyNTcjN9PU3LH1HqOZRpCD7wqI4ehjhHMSC9q3Jyx5_9Cb0AOQ-KAVs6VNVaYw4IkJZ9g/exec',

  // Daftar kelas yang tersedia (sesuaikan kebutuhan)
  KELAS_OPTIONS: ['Grup A', 'Grup B'],

  // Daftar status jadwal
  STATUS_JADWAL: ['Aktif', 'Pending', 'Cancel'],

  // Kontak admin (untuk halaman home & footer)
  CONTACT: {
    whatsapp: '6285751438324',           // ganti nomor
    email: 'bontang.aquatik@gmail.com',      // ganti email
    alamat: 'Bontang, Kalimantan Timur'       // ganti alamat
  },

  // Nama brand
  BRAND_NAME: 'Bontang Aquatik'
};
