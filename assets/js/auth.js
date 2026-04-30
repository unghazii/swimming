/**
 * Auth helper - mengelola session via sessionStorage
 * Note: sessionStorage tidak persist antar tab tapi cukup untuk pengamanan dasar.
 */

const Auth = {
  KEY: 'swim_session',

  setSession(role, data) {
    const session = { role, data, timestamp: Date.now() };
    sessionStorage.setItem(this.KEY, JSON.stringify(session));
  },

  getSession() {
    const raw = sessionStorage.getItem(this.KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  isLoggedIn() { return this.getSession() !== null; },

  getRole() {
    const s = this.getSession();
    return s ? s.role : null;
  },

  getUser() {
    const s = this.getSession();
    return s ? s.data : null;
  },

  logout() {
    sessionStorage.removeItem(this.KEY);
    window.location.href = 'index.html';
  },

  /**
   * Pastikan user sudah login & memiliki role tertentu.
   * Jika tidak, redirect ke login.
   */
  requireRole(role) {
    const s = this.getSession();
    if (!s || s.role !== role) {
      Utils.notify('Anda harus login terlebih dahulu', 'warning');
      setTimeout(() => window.location.href = 'login.html', 1200);
      return false;
    }
    return true;
  }
};
