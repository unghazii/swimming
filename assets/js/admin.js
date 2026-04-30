// Logic Dashboard Admin
let cachePeserta = [];
let cacheJadwal = [];
let cacheKehadiran = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireRole('admin')) return;
  Utils.mountNavbar('admin');

  const user = Auth.getUser();
  document.getElementById('admin-username').textContent = user.username;

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Search filters
  document.getElementById('search-peserta').addEventListener('input', (e) => filterPeserta(e.target.value));
  document.getElementById('search-jadwal').addEventListener('input', (e) => filterJadwal(e.target.value));
  document.getElementById('filter-periode').addEventListener('change', () => loadKehadiran());

  // Buttons
  document.getElementById('btn-add-jadwal').addEventListener('click', () => openJadwalModal());
  document.getElementById('btn-refresh').addEventListener('click', loadAll);

  // Initial load
  await loadAll();
});

async function loadAll() {
  await Promise.all([loadPeserta(), loadJadwal(), loadKehadiran()]);
  updateStats();
}

function updateStats() {
  document.getElementById('stat-total-peserta').textContent = cachePeserta.length;
  document.getElementById('stat-aktif-peserta').textContent = cachePeserta.filter(p =>
    p.Status_Pembayaran === true || String(p.Status_Pembayaran).toUpperCase() === 'TRUE'
  ).length;
  document.getElementById('stat-total-jadwal').textContent = cacheJadwal.length;
  document.getElementById('stat-total-kehadiran').textContent = cacheKehadiran.length;
}

// ====================== PESERTA ======================

async function loadPeserta() {
  const res = await API.call('getAllPeserta');
  if (res.success) {
    cachePeserta = res.data;
    renderPeserta(cachePeserta);
  } else {
    Utils.notify(res.message, 'error');
  }
}

function renderPeserta(list) {
  const tbody = document.getElementById('tbody-peserta');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:30px;">Belum ada data peserta</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(p => {
    const isPaid = p.Status_Pembayaran === true || String(p.Status_Pembayaran).toUpperCase() === 'TRUE';
    const persenClass = p.persentase >= 75 ? 'high' : p.persentase >= 40 ? 'mid' : 'low';
    return `
      <tr>
        <td>${Utils.escapeHtml(p.Id_Peserta)}</td>
        <td>${Utils.escapeHtml(p.Nama_Lengkap)}</td>
        <td>${Utils.escapeHtml(p.Username)}</td>
        <td>${Utils.escapeHtml(p.Nomor_Whatsapp)}</td>
        <td>${Utils.escapeHtml(p.Kelas || '-')}</td>
        <td>${Utils.escapeHtml(p.Tanggal_Mulai || '-')}</td>
        <td>${Utils.escapeHtml(p.Tanggal_Akhir || '-')}</td>
        <td><span class="badge ${isPaid ? 'badge-success' : 'badge-warning'}">${isPaid ? 'LUNAS' : 'BELUM'}</span></td>
        <td>${p.total_hadir} / ${p.total_jadwal}</td>
        <td>
          <div class="persen-cell">
            <div class="persen-bar"><div class="persen-fill ${persenClass}" style="width:${p.persentase}%"></div></div>
            <span class="persen-text">${p.persentase}%</span>
          </div>
        </td>
        <td>
          <div class="action-btns">
            <button class="icon-btn edit" onclick="openPesertaModal('${p.Id_Peserta}')" title="Edit">✏️</button>
            <button class="icon-btn delete" onclick="deletePeserta('${p.Id_Peserta}')" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filterPeserta(q) {
  q = q.toLowerCase();
  const filtered = cachePeserta.filter(p =>
    (p.Nama_Lengkap || '').toLowerCase().includes(q) ||
    (p.Username || '').toLowerCase().includes(q) ||
    (p.Kelas || '').toLowerCase().includes(q)
  );
  renderPeserta(filtered);
}

function openPesertaModal(id) {
  const p = cachePeserta.find(x => x.Id_Peserta === id);
  if (!p) return;
  const isPaid = p.Status_Pembayaran === true || String(p.Status_Pembayaran).toUpperCase() === 'TRUE';

  const html = `
    <div class="modal-backdrop active" id="m-peserta">
      <div class="modal">
        <div class="modal-header">
          <h3>Edit Peserta</h3>
          <button class="modal-close" onclick="closeModal('m-peserta')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input class="form-control" id="ep-nama" value="${Utils.escapeHtml(p.Nama_Lengkap)}">
          </div>
          <div class="form-group">
            <label>Username</label>
            <input class="form-control" id="ep-username" value="${Utils.escapeHtml(p.Username)}">
          </div>
          <div class="form-group">
            <label>Password Baru <small>(kosongkan jika tidak diubah)</small></label>
            <input type="password" class="form-control" id="ep-password" placeholder="•••••••">
          </div>
          <div class="form-group">
            <label>Nomor WhatsApp</label>
            <input class="form-control" id="ep-wa" value="${Utils.escapeHtml(p.Nomor_Whatsapp)}">
          </div>
          <div class="form-group">
            <label>Kelas</label>
            <select class="form-control" id="ep-kelas">
              <option value="">- Pilih Kelas -</option>
              ${CONFIG.KELAS_OPTIONS.map(k =>
                `<option value="${k}" ${p.Kelas === k ? 'selected' : ''}>${k}</option>`
              ).join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="form-group">
              <label>Tanggal Mulai</label>
              <input type="date" class="form-control" id="ep-mulai" value="${Utils.formatDateInput(p.Tanggal_Mulai)}">
            </div>
            <div class="form-group">
              <label>Tanggal Akhir</label>
              <input type="date" class="form-control" id="ep-akhir" value="${Utils.formatDateInput(p.Tanggal_Akhir)}">
            </div>
          </div>
          <div class="form-group">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="ep-paid" ${isPaid ? 'checked' : ''}>
              <span>Status Pembayaran LUNAS (TRUE)</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('m-peserta')">Batal</button>
          <button class="btn btn-primary" onclick="savePeserta('${id}')">Simpan</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function savePeserta(id) {
  const data = {
    id,
    nama_lengkap: document.getElementById('ep-nama').value.trim(),
    username: document.getElementById('ep-username').value.trim(),
    password: document.getElementById('ep-password').value,
    nomor_whatsapp: document.getElementById('ep-wa').value.trim(),
    kelas: document.getElementById('ep-kelas').value,
    tanggal_mulai: document.getElementById('ep-mulai').value,
    tanggal_akhir: document.getElementById('ep-akhir').value,
    status_pembayaran: document.getElementById('ep-paid').checked
  };
  const res = await API.call('updatePeserta', data);
  if (res.success) {
    Utils.notify(res.message, 'success');
    closeModal('m-peserta');
    await loadPeserta();
    updateStats();
  } else {
    Utils.notify(res.message, 'error');
  }
}

async function deletePeserta(id) {
  const ok = await Utils.confirm('Yakin ingin menghapus peserta ini? Data tidak bisa dikembalikan.');
  if (!ok) return;
  const res = await API.call('deletePeserta', { id });
  if (res.success) {
    Utils.notify(res.message, 'success');
    await loadPeserta();
    updateStats();
  } else {
    Utils.notify(res.message, 'error');
  }
}

// ====================== JADWAL ======================

async function loadJadwal() {
  const res = await API.call('getAllJadwal');
  if (res.success) {
    cacheJadwal = res.data;
    renderJadwal(cacheJadwal);
  } else {
    Utils.notify(res.message, 'error');
  }
}

function renderJadwal(list) {
  const tbody = document.getElementById('tbody-jadwal');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">Belum ada jadwal</td></tr>`;
    return;
  }
  // Sort terbaru di atas
  list = [...list].sort((a, b) => new Date(b.Tanggal) - new Date(a.Tanggal));

  tbody.innerHTML = list.map(j => {
    const status = String(j.Status).toLowerCase();
    const badgeClass = status === 'aktif' ? 'badge-success' :
                       status === 'pending' ? 'badge-warning' : 'badge-danger';
    return `
      <tr>
        <td>${Utils.escapeHtml(Utils.formatDate(j.Tanggal))}</td>
        <td>${Utils.escapeHtml(j.Pukul)}</td>
        <td>${Utils.escapeHtml(j.Kelas)}</td>
        <td>${Utils.escapeHtml(j.Lokasi)}</td>
        <td><span class="badge ${badgeClass}">${Utils.escapeHtml(j.Status)}</span></td>
        <td>${Utils.escapeHtml(j.Id_Pelatih)}</td>
        <td>
          <div class="action-btns">
            <button class="icon-btn edit" onclick="openJadwalModal('${j.Id_Jadwal}')" title="Edit">✏️</button>
            <button class="icon-btn delete" onclick="deleteJadwal('${j.Id_Jadwal}')" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function filterJadwal(q) {
  q = q.toLowerCase();
  const filtered = cacheJadwal.filter(j =>
    (j.Kelas || '').toLowerCase().includes(q) ||
    (j.Lokasi || '').toLowerCase().includes(q) ||
    (j.Status || '').toLowerCase().includes(q) ||
    String(j.Tanggal || '').toLowerCase().includes(q)
  );
  renderJadwal(filtered);
}

function openJadwalModal(id) {
  const isEdit = !!id;
  const j = isEdit ? cacheJadwal.find(x => x.Id_Jadwal === id) : {};

  const html = `
    <div class="modal-backdrop active" id="m-jadwal">
      <div class="modal">
        <div class="modal-header">
          <h3>${isEdit ? 'Edit' : 'Tambah'} Jadwal</h3>
          <button class="modal-close" onclick="closeModal('m-jadwal')">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tanggal *</label>
            <input type="date" class="form-control" id="ej-tanggal" value="${isEdit ? Utils.formatDateInput(j.Tanggal) : ''}">
          </div>
          <div class="form-group">
            <label>Pukul *</label>
            <input type="time" class="form-control" id="ej-pukul" value="${isEdit ? Utils.escapeHtml(j.Pukul) : ''}">
          </div>
          <div class="form-group">
            <label>Lokasi *</label>
            <input class="form-control" id="ej-lokasi" placeholder="Kolam Renang ABC" value="${isEdit ? Utils.escapeHtml(j.Lokasi) : ''}">
          </div>
          <div class="form-group">
            <label>Kelas *</label>
            <select class="form-control" id="ej-kelas">
              ${CONFIG.KELAS_OPTIONS.map(k =>
                `<option value="${k}" ${isEdit && j.Kelas === k ? 'selected' : ''}>${k}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Status *</label>
            <select class="form-control" id="ej-status">
              ${CONFIG.STATUS_JADWAL.map(s =>
                `<option value="${s}" ${isEdit && j.Status === s ? 'selected' : (!isEdit && s === 'Pending' ? 'selected' : '')}>${s}</option>`
              ).join('')}
            </select>
            <p class="form-helper">Ubah ke "Aktif" 2 jam sebelum kelas dimulai agar peserta bisa absen.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('m-jadwal')">Batal</button>
          <button class="btn btn-primary" onclick="saveJadwal('${id || ''}')">Simpan</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

async function saveJadwal(id) {
  const data = {
    tanggal: document.getElementById('ej-tanggal').value,
    pukul: document.getElementById('ej-pukul').value,
    lokasi: document.getElementById('ej-lokasi').value.trim(),
    kelas: document.getElementById('ej-kelas').value,
    status: document.getElementById('ej-status').value
  };
  if (!data.tanggal || !data.pukul || !data.lokasi) {
    Utils.notify('Tanggal, pukul, dan lokasi wajib diisi', 'warning');
    return;
  }

  let res;
  if (id) {
    res = await API.call('updateJadwal', { id, ...data });
  } else {
    const user = Auth.getUser();
    res = await API.call('createJadwal', { id_pelatih: user.id, ...data });
  }
  if (res.success) {
    Utils.notify(res.message, 'success');
    closeModal('m-jadwal');
    await loadJadwal();
    updateStats();
  } else {
    Utils.notify(res.message, 'error');
  }
}

async function deleteJadwal(id) {
  const ok = await Utils.confirm('Yakin ingin menghapus jadwal ini?');
  if (!ok) return;
  const res = await API.call('deleteJadwal', { id });
  if (res.success) {
    Utils.notify(res.message, 'success');
    await loadJadwal();
    updateStats();
  } else {
    Utils.notify(res.message, 'error');
  }
}

// ====================== KEHADIRAN ======================

async function loadKehadiran() {
  const periode = document.getElementById('filter-periode').value;
  const res = await API.call('getAllKehadiran', { periode });
  if (res.success) {
    cacheKehadiran = res.data;
    renderKehadiran(cacheKehadiran);
    updateStats();
  } else {
    Utils.notify(res.message, 'error');
  }
}

function renderKehadiran(list) {
  const tbody = document.getElementById('tbody-kehadiran');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">Belum ada data kehadiran</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(k => {
    const isHadir = k.Status === true || String(k.Status).toUpperCase() === 'TRUE';
    return `
      <tr>
        <td>${Utils.escapeHtml(k.tanggal)}</td>
        <td>${Utils.escapeHtml(k.pukul)}</td>
        <td>${Utils.escapeHtml(k.nama_peserta)}</td>
        <td>${Utils.escapeHtml(k.kelas)}</td>
        <td>${Utils.escapeHtml(k.lokasi)}</td>
        <td><span class="badge ${isHadir ? 'badge-success' : 'badge-danger'}">${isHadir ? 'HADIR' : 'TIDAK'}</span></td>
        <td>
          <div class="action-btns">
            <button class="icon-btn delete" onclick="deleteKehadiran('${k.Id_Kehadiran}')" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

async function deleteKehadiran(id) {
  const ok = await Utils.confirm('Yakin ingin menghapus data kehadiran ini?');
  if (!ok) return;
  const res = await API.call('deleteKehadiran', { id });
  if (res.success) {
    Utils.notify(res.message, 'success');
    await loadKehadiran();
  } else {
    Utils.notify(res.message, 'error');
  }
}

// ====================== HELPER ======================

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
