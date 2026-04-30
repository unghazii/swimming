/**
 * Utility helpers - notifikasi, loader, format date, modal, dll.
 */

const Utils = {
  /**
   * Toast notification.
   * @param {string} msg - Pesan
   * @param {'info'|'success'|'error'|'warning'} type
   */
  notify(msg, type = 'info', duration = 3500) {
    let container = document.getElementById('notif-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notif-container';
      document.body.appendChild(container);
    }
    const notif = document.createElement('div');
    notif.className = `notif ${type}`;
    notif.textContent = msg;
    container.appendChild(notif);

    setTimeout(() => {
      notif.classList.add('fadeout');
      setTimeout(() => notif.remove(), 300);
    }, duration);
  },

  showLoader(show = true) {
    let loader = document.getElementById('loader-overlay');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'loader-overlay';
      loader.className = 'loader-overlay';
      loader.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(loader);
    }
    loader.classList.toggle('active', show);
  },

  formatDate(d) {
    if (!d) return '-';
    const date = (d instanceof Date) ? d : new Date(d);
    if (isNaN(date.getTime())) return d; // bukan tanggal valid, return apa adanya
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  },

  formatDateInput(d) {
    if (!d) return '';
    const date = (d instanceof Date) ? d : new Date(d);
    if (isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  formatBool(v) {
    if (v === true || String(v).toUpperCase() === 'TRUE') return 'TRUE';
    return 'FALSE';
  },

  /**
   * Konfirmasi dengan custom modal (tidak pakai native confirm() yg jelek).
   */
  confirm(message) {
    return new Promise(resolve => {
      const html = `
        <div class="modal-backdrop active" id="confirm-modal">
          <div class="modal" style="max-width:400px;">
            <div class="modal-body">
              <p style="font-size:15px;">${message}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-confirm="no">Batal</button>
              <button class="btn btn-danger" data-confirm="yes">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>`;
      document.body.insertAdjacentHTML('beforeend', html);
      const modal = document.getElementById('confirm-modal');
      modal.querySelectorAll('[data-confirm]').forEach(b => {
        b.addEventListener('click', () => {
          const ans = b.dataset.confirm === 'yes';
          modal.remove();
          resolve(ans);
        });
      });
    });
  },

  /**
   * Escape HTML untuk mencegah XSS sederhana.
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Mount navbar konsisten di semua halaman + handle responsif.
   */
  mountNavbar(activeRoute = '') {
    const session = Auth.getSession();
    let menuRight = '';
    if (session && session.role === 'peserta') {
      menuRight = `
        <div class="user-info"><span>👤 ${this.escapeHtml(session.data.nama || session.data.username)}</span></div>
        <button class="btn btn-sm btn-secondary" onclick="Auth.logout()">Logout</button>
      `;
    } else if (session && session.role === 'admin') {
      menuRight = `
        <div class="user-info"><span>🛡️ ${this.escapeHtml(session.data.username)} (Admin)</span></div>
        <button class="btn btn-sm btn-secondary" onclick="Auth.logout()">Logout</button>
      `;
    } else {
      menuRight = `
        <a href="login.html" class="${activeRoute === 'login' ? 'active' : ''}">Login</a>
        <a href="registrasi.html" class="btn btn-primary btn-sm">Daftar Sekarang</a>
      `;
    }

    const html = `
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="index.html" class="navbar-brand">
            <div class="navbar-brand-logo">🏊</div>
            <span>${CONFIG.BRAND_NAME}</span>
          </a>
          <button class="navbar-toggle" id="navbar-toggle" aria-label="Menu">☰</button>
          <ul class="navbar-menu" id="navbar-menu">
            <li><a href="index.html" class="${activeRoute === 'home' ? 'active' : ''}">Home</a></li>
            ${session && session.role === 'peserta' ? `<li><a href="peserta.html" class="${activeRoute === 'peserta' ? 'active' : ''}">Dashboard</a></li>` : ''}
            ${session && session.role === 'admin' ? `<li><a href="admin.html" class="${activeRoute === 'admin' ? 'active' : ''}">Admin Panel</a></li>` : ''}
            <li>${menuRight}</li>
          </ul>
        </div>
      </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', html);

    document.getElementById('navbar-toggle').addEventListener('click', () => {
      document.getElementById('navbar-menu').classList.toggle('show');
    });
  },

  /**
   * Mount footer.
   */
  mountFooter() {
    const html = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <h4>${CONFIG.BRAND_NAME}</h4>
              <p>Kelas pelatihan renang profesional dengan sistem tersetruktur dan fleksibel.</p>
            </div>
            <div>
              <h4>Navigasi</h4>
              <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="registrasi.html">Registrasi</a></li>
                <li><a href="login.html">Login</a></li>
              </ul>
            </div>
            <div>
              <h4>Kontak</h4>
              <ul>
                <li>📱 ${CONFIG.CONTACT.whatsapp}</li>
                <li>✉️ ${CONFIG.CONTACT.email}</li>
                <li>📍 ${CONFIG.CONTACT.alamat}</li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            © ${new Date().getFullYear()} ${CONFIG.BRAND_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};
