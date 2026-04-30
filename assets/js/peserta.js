// Logic Dashboard Peserta
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireRole('peserta')) return;
  Utils.mountNavbar('peserta');

  const user = Auth.getUser();
  document.getElementById('user-nama').textContent = user.nama;
  document.getElementById('user-kelas').textContent = user.kelas || 'Belum ditentukan';

  await loadDashboard();
});

async function loadDashboard() {
  const user = Auth.getUser();

  // Ambil data jadwal & kehadiran paralel
  const [jadwalRes, hadirRes] = await Promise.all([
    API.call('getJadwalPeserta', { id_peserta: user.id }),
    API.call('getKehadiranPeserta', { id_peserta: user.id })
  ]);

  if (hadirRes.success) {
    const d = hadirRes.data;
    document.getElementById('stat-total').textContent = d.total_jadwal;
    document.getElementById('stat-hadir').textContent = d.total_hadir;
    document.getElementById('stat-persen').textContent = d.persentase + '%';
    document.getElementById('progress-fill').style.width = d.persentase + '%';
  }

  if (jadwalRes.success) {
    renderJadwal(jadwalRes.data);
  } else {
    Utils.notify(jadwalRes.message || 'Gagal memuat jadwal', 'error');
  }
}

function renderJadwal(jadwals) {
  const container = document.getElementById('jadwal-list');
  if (!jadwals || jadwals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📅</div>
        <p>Belum ada jadwal pelatihan untuk kelas Anda.</p>
      </div>`;
    return;
  }

  // Sort by tanggal (descending - terbaru di atas)
  jadwals.sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));

  container.innerHTML = `
    <div class="jadwal-grid">
      ${jadwals.map(j => {
        const status = String(j.Status).toLowerCase();
        const badgeClass = status === 'aktif' ? 'badge-success' :
                           status === 'pending' ? 'badge-warning' : 'badge-danger';
        const canAbsen = status === 'aktif' && !j.sudah_absen;
        const btnText = j.sudah_absen ? '✓ Sudah Absen' :
                        status !== 'aktif' ? 'Belum Dibuka' : 'Absen Sekarang';
        const btnClass = j.sudah_absen ? 'btn-success' :
                         status !== 'aktif' ? 'btn-secondary' : 'btn-primary';

        return `
          <div class="jadwal-card">
            <div class="jadwal-date">${Utils.escapeHtml(Utils.formatDate(j.Tanggal))}</div>
            <h4>${Utils.escapeHtml(j.Kelas)}</h4>
            <div class="jadwal-info">
              <span>🕐 ${Utils.escapeHtml(j.Pukul)}</span>
              <span>📍 ${Utils.escapeHtml(j.Lokasi)}</span>
            </div>
            <div class="jadwal-actions">
              <span class="badge ${badgeClass}">${Utils.escapeHtml(j.Status)}</span>
              <button class="btn btn-sm ${btnClass}"
                      ${!canAbsen ? 'disabled' : ''}
                      onclick="absenJadwal('${j.Id_Jadwal}')">
                ${btnText}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function absenJadwal(idJadwal) {
  const ok = await Utils.confirm('Konfirmasi absensi kehadiran Anda untuk jadwal ini?');
  if (!ok) return;
  const user = Auth.getUser();
  const res = await API.call('absen', { id_jadwal: idJadwal, id_peserta: user.id });
  if (res.success) {
    Utils.notify(res.message, 'success');
    await loadDashboard();
  } else {
    Utils.notify(res.message, 'error');
  }
}
