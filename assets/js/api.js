/**
 * Helper untuk komunikasi dengan Google Apps Script API.
 * Memakai text/plain content-type untuk menghindari CORS preflight (Apps Script tidak support OPTIONS).
 */

const API = {
  /**
   * Mengirim request POST ke Apps Script.
   * @param {string} action - Nama action (sesuai switch di Code.gs)
   * @param {object} payload - Data tambahan
   */
  async call(action, payload = {}) {
    Utils.showLoader(true);
    try {
      const body = JSON.stringify({ action, ...payload });
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        // text/plain agar tidak ada preflight CORS dari browser
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: body,
        redirect: 'follow'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('API error:', err);
      return { success: false, message: 'Gagal terhubung ke server: ' + err.message };
    } finally {
      Utils.showLoader(false);
    }
  }
};
