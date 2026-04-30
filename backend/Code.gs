/**
 * ===================================================================
 * BACKEND API - Aplikasi Absensi Kelas Pelatihan Renang
 * Deploy: Extensions > Apps Script > Deploy > New Deployment
 *         Type: Web App | Execute as: Me | Who has access: Anyone
 * ===================================================================
 *
 * SETUP SPREADSHEET:
 * Buat Google Spreadsheet dengan 4 sheet (nama harus persis):
 *
 * Sheet "Peserta": kolom A-I
 *   Id_Peserta | Nama_Lengkap | Username | Password | Nomor_Whatsapp |
 *   Kelas | Tanggal_Mulai | Tanggal_Akhir | Status_Pembayaran
 *
 * Sheet "Pelatih": kolom A-C
 *   Id_Pelatih | Username | Password
 *
 * Sheet "Jadwal": kolom A-G
 *   Id_Jadwal | Id_Pelatih | Tanggal | Pukul | Lokasi | Kelas | Status
 *
 * Sheet "Kehadiran": kolom A-D
 *   Id_Kehadiran | Id_Jadwal | Id_Peserta | Status
 *
 * Lalu paste SPREADSHEET_ID di bawah ini.
 */

// ⚠️ GANTI DENGAN ID SPREADSHEET ANDA (ambil dari URL spreadsheet)
const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_DISINI';

// ====================== ENTRY POINTS ======================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let params = {};
    if (e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      params = e.parameter;
    }

    const action = params.action;
    let result;

    switch (action) {
      // AUTH
      case 'register':       result = registerPeserta(params); break;
      case 'login':          result = login(params); break;

      // PESERTA
      case 'getJadwalPeserta':   result = getJadwalPeserta(params); break;
      case 'absen':              result = absen(params); break;
      case 'getKehadiranPeserta':result = getKehadiranPeserta(params); break;

      // ADMIN - PESERTA
      case 'getAllPeserta':  result = getAllPeserta(); break;
      case 'updatePeserta':  result = updatePeserta(params); break;
      case 'deletePeserta':  result = deletePeserta(params); break;

      // ADMIN - JADWAL
      case 'getAllJadwal':   result = getAllJadwal(); break;
      case 'createJadwal':   result = createJadwal(params); break;
      case 'updateJadwal':   result = updateJadwal(params); break;
      case 'deleteJadwal':   result = deleteJadwal(params); break;

      // ADMIN - KEHADIRAN
      case 'getAllKehadiran':result = getAllKehadiran(params); break;
      case 'updateKehadiran':result = updateKehadiran(params); break;
      case 'deleteKehadiran':result = deleteKehadiran(params); break;

      default:
        result = { success: false, message: 'Action tidak dikenal: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Server error: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ====================== HELPER ======================

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function generateId(prefix) {
  return prefix + '-' + new Date().getTime();
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function findRowIndex(sheet, idColumn, idValue) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColumn]) === String(idValue)) return i + 1; // 1-based
  }
  return -1;
}

// ====================== AUTH ======================

function registerPeserta(p) {
  const sheet = getSheet('Peserta');
  const all = sheetToObjects(sheet);
  // cek username unik
  if (all.some(x => x.Username === p.username)) {
    return { success: false, message: 'Username sudah digunakan' };
  }
  const id = generateId('PST');
  sheet.appendRow([
    id,
    p.nama_lengkap,
    p.username,
    p.password,
    p.nomor_whatsapp,
    '',     // Kelas (diisi admin)
    '',     // Tanggal_Mulai
    '',     // Tanggal_Akhir
    false   // Status_Pembayaran
  ]);
  return { success: true, message: 'Registrasi berhasil. Admin akan menghubungi Anda via WhatsApp.', id: id };
}

function login(p) {
  // Coba sebagai admin
  const adminSheet = getSheet('Pelatih');
  const admins = sheetToObjects(adminSheet);
  const admin = admins.find(a => a.Username === p.username && String(a.Password) === String(p.password));
  if (admin) {
    return {
      success: true,
      role: 'admin',
      data: { id: admin.Id_Pelatih, username: admin.Username }
    };
  }

  // Coba sebagai peserta
  const pesertaSheet = getSheet('Peserta');
  const pesertas = sheetToObjects(pesertaSheet);
  const peserta = pesertas.find(x => x.Username === p.username && String(x.Password) === String(p.password));
  if (peserta) {
    if (peserta.Status_Pembayaran !== true && String(peserta.Status_Pembayaran).toUpperCase() !== 'TRUE') {
      return { success: false, message: 'Pembayaran belum dikonfirmasi admin. Silakan hubungi admin.' };
    }
    return {
      success: true,
      role: 'peserta',
      data: {
        id: peserta.Id_Peserta,
        nama: peserta.Nama_Lengkap,
        username: peserta.Username,
        kelas: peserta.Kelas,
        tanggal_mulai: peserta.Tanggal_Mulai,
        tanggal_akhir: peserta.Tanggal_Akhir
      }
    };
  }

  return { success: false, message: 'Username atau password salah' };
}

// ====================== PESERTA ======================

function getJadwalPeserta(p) {
  const peserta = sheetToObjects(getSheet('Peserta')).find(x => x.Id_Peserta === p.id_peserta);
  if (!peserta) return { success: false, message: 'Peserta tidak ditemukan' };

  const jadwal = sheetToObjects(getSheet('Jadwal')).filter(j => j.Kelas === peserta.Kelas);
  const kehadiran = sheetToObjects(getSheet('Kehadiran')).filter(k => k.Id_Peserta === p.id_peserta);

  // tandai jadwal yg sudah diabsen
  const jadwalWithAbsen = jadwal.map(j => {
    const sudahAbsen = kehadiran.find(k => k.Id_Jadwal === j.Id_Jadwal);
    return {
      ...j,
      Tanggal: formatDate(j.Tanggal),
      sudah_absen: !!sudahAbsen
    };
  });

  return { success: true, data: jadwalWithAbsen, kelas: peserta.Kelas };
}

function absen(p) {
  const jadwal = sheetToObjects(getSheet('Jadwal')).find(j => j.Id_Jadwal === p.id_jadwal);
  if (!jadwal) return { success: false, message: 'Jadwal tidak ditemukan' };
  if (String(jadwal.Status).toLowerCase() !== 'aktif') {
    return { success: false, message: 'Absensi belum dibuka. Status jadwal: ' + jadwal.Status };
  }

  const kehadiranSheet = getSheet('Kehadiran');
  const existing = sheetToObjects(kehadiranSheet)
    .find(k => k.Id_Jadwal === p.id_jadwal && k.Id_Peserta === p.id_peserta);
  if (existing) return { success: false, message: 'Anda sudah melakukan absensi untuk jadwal ini' };

  const id = generateId('KHD');
  kehadiranSheet.appendRow([id, p.id_jadwal, p.id_peserta, true]);
  return { success: true, message: 'Absensi berhasil dicatat' };
}

function getKehadiranPeserta(p) {
  const peserta = sheetToObjects(getSheet('Peserta')).find(x => x.Id_Peserta === p.id_peserta);
  if (!peserta) return { success: false, message: 'Peserta tidak ditemukan' };

  const allJadwal = sheetToObjects(getSheet('Jadwal')).filter(j => j.Kelas === peserta.Kelas);
  const kehadiran = sheetToObjects(getSheet('Kehadiran')).filter(k => k.Id_Peserta === p.id_peserta);

  const totalJadwal = allJadwal.length;
  const totalHadir = kehadiran.length;
  const persentase = totalJadwal > 0 ? Math.round((totalHadir / totalJadwal) * 100) : 0;

  return {
    success: true,
    data: {
      total_jadwal: totalJadwal,
      total_hadir: totalHadir,
      persentase: persentase,
      kehadiran: kehadiran
    }
  };
}

// ====================== ADMIN - PESERTA ======================

function getAllPeserta() {
  const pesertas = sheetToObjects(getSheet('Peserta'));
  const allJadwal = sheetToObjects(getSheet('Jadwal'));
  const allKehadiran = sheetToObjects(getSheet('Kehadiran'));

  const enriched = pesertas.map(p => {
    const totalJadwal = allJadwal.filter(j => j.Kelas === p.Kelas).length;
    const totalHadir = allKehadiran.filter(k => k.Id_Peserta === p.Id_Peserta).length;
    const persentase = totalJadwal > 0 ? Math.round((totalHadir / totalJadwal) * 100) : 0;
    return {
      ...p,
      Tanggal_Mulai: formatDate(p.Tanggal_Mulai),
      Tanggal_Akhir: formatDate(p.Tanggal_Akhir),
      total_jadwal: totalJadwal,
      total_hadir: totalHadir,
      persentase: persentase
    };
  });
  return { success: true, data: enriched };
}

function updatePeserta(p) {
  const sheet = getSheet('Peserta');
  const row = findRowIndex(sheet, 0, p.id);
  if (row === -1) return { success: false, message: 'Peserta tidak ditemukan' };

  // kolom: B=Nama, C=Username, D=Password, E=WA, F=Kelas, G=TglMulai, H=TglAkhir, I=Status
  if (p.nama_lengkap !== undefined) sheet.getRange(row, 2).setValue(p.nama_lengkap);
  if (p.username !== undefined) sheet.getRange(row, 3).setValue(p.username);
  if (p.password !== undefined && p.password !== '') sheet.getRange(row, 4).setValue(p.password);
  if (p.nomor_whatsapp !== undefined) sheet.getRange(row, 5).setValue(p.nomor_whatsapp);
  if (p.kelas !== undefined) sheet.getRange(row, 6).setValue(p.kelas);
  if (p.tanggal_mulai !== undefined) sheet.getRange(row, 7).setValue(p.tanggal_mulai);
  if (p.tanggal_akhir !== undefined) sheet.getRange(row, 8).setValue(p.tanggal_akhir);
  if (p.status_pembayaran !== undefined) sheet.getRange(row, 9).setValue(p.status_pembayaran === true || p.status_pembayaran === 'true');

  return { success: true, message: 'Data peserta diperbarui' };
}

function deletePeserta(p) {
  const sheet = getSheet('Peserta');
  const row = findRowIndex(sheet, 0, p.id);
  if (row === -1) return { success: false, message: 'Peserta tidak ditemukan' };
  sheet.deleteRow(row);
  return { success: true, message: 'Peserta dihapus' };
}

// ====================== ADMIN - JADWAL ======================

function getAllJadwal() {
  const jadwals = sheetToObjects(getSheet('Jadwal')).map(j => ({
    ...j,
    Tanggal: formatDate(j.Tanggal)
  }));
  return { success: true, data: jadwals };
}

function createJadwal(p) {
  const sheet = getSheet('Jadwal');
  const id = generateId('JDW');
  sheet.appendRow([
    id,
    p.id_pelatih,
    p.tanggal,
    p.pukul,
    p.lokasi,
    p.kelas,
    p.status || 'Pending'
  ]);
  return { success: true, message: 'Jadwal dibuat', id: id };
}

function updateJadwal(p) {
  const sheet = getSheet('Jadwal');
  const row = findRowIndex(sheet, 0, p.id);
  if (row === -1) return { success: false, message: 'Jadwal tidak ditemukan' };

  if (p.tanggal !== undefined) sheet.getRange(row, 3).setValue(p.tanggal);
  if (p.pukul !== undefined) sheet.getRange(row, 4).setValue(p.pukul);
  if (p.lokasi !== undefined) sheet.getRange(row, 5).setValue(p.lokasi);
  if (p.kelas !== undefined) sheet.getRange(row, 6).setValue(p.kelas);
  if (p.status !== undefined) sheet.getRange(row, 7).setValue(p.status);

  return { success: true, message: 'Jadwal diperbarui' };
}

function deleteJadwal(p) {
  const sheet = getSheet('Jadwal');
  const row = findRowIndex(sheet, 0, p.id);
  if (row === -1) return { success: false, message: 'Jadwal tidak ditemukan' };
  sheet.deleteRow(row);
  return { success: true, message: 'Jadwal dihapus' };
}

// ====================== ADMIN - KEHADIRAN ======================

function getAllKehadiran(p) {
  const kehadirans = sheetToObjects(getSheet('Kehadiran'));
  const pesertas = sheetToObjects(getSheet('Peserta'));
  const jadwals = sheetToObjects(getSheet('Jadwal'));

  let enriched = kehadirans.map(k => {
    const peserta = pesertas.find(x => x.Id_Peserta === k.Id_Peserta);
    const jadwal = jadwals.find(j => j.Id_Jadwal === k.Id_Jadwal);
    return {
      ...k,
      nama_peserta: peserta ? peserta.Nama_Lengkap : '-',
      tanggal: jadwal ? formatDate(jadwal.Tanggal) : '-',
      tanggal_raw: jadwal ? jadwal.Tanggal : null,
      pukul: jadwal ? jadwal.Pukul : '-',
      kelas: jadwal ? jadwal.Kelas : '-',
      lokasi: jadwal ? jadwal.Lokasi : '-'
    };
  });

  // Filter periode (mingguan/bulanan/tahunan)
  if (p && p.periode && p.periode !== 'all') {
    const now = new Date();
    enriched = enriched.filter(k => {
      if (!k.tanggal_raw) return false;
      const tgl = new Date(k.tanggal_raw);
      if (p.periode === 'minggu') {
        const seminggu = 7 * 24 * 60 * 60 * 1000;
        return (now - tgl) <= seminggu && (now - tgl) >= 0;
      }
      if (p.periode === 'bulan') {
        return tgl.getMonth() === now.getMonth() && tgl.getFullYear() === now.getFullYear();
      }
      if (p.periode === 'tahun') {
        return tgl.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  return { success: true, data: enriched };
}

function updateKehadiran(p) {
  const sheet = getSheet('Kehadiran');
  const row = findRowIndex(sheet, 0, p.id);
  if (row === -1) return { success: false, message: 'Kehadiran tidak ditemukan' };
  if (p.status !== undefined) sheet.getRange(row, 4).setValue(p.status === true || p.status === 'true');
  return { success: true, message: 'Kehadiran diperbarui' };
}

function deleteKehadiran(p) {
  const sheet = getSheet('Kehadiran');
  const row = findRowIndex(sheet, 0, p.id);
  if (row === -1) return { success: false, message: 'Kehadiran tidak ditemukan' };
  sheet.deleteRow(row);
  return { success: true, message: 'Kehadiran dihapus' };
}

// ====================== UTIL ======================

function formatDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
  }
  return String(d);
}

/**
 * Setup awal (jalankan sekali manual dari editor):
 * Membuat satu admin default.
 */
function setupAdminDefault() {
  const sheet = getSheet('Pelatih');
  if (sheet.getLastRow() < 2) {
    sheet.appendRow(['PLT-001', 'admin', 'admin123']);
    Logger.log('Admin default dibuat: admin / admin123');
  } else {
    Logger.log('Admin sudah ada');
  }
}
