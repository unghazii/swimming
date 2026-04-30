// Logic halaman Registrasi
document.addEventListener('DOMContentLoaded', () => {
  Utils.mountNavbar('registrasi');

  const form = document.getElementById('form-registrasi');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      nama_lengkap: fd.get('nama_lengkap').trim(),
      username: fd.get('username').trim(),
      password: fd.get('password'),
      nomor_whatsapp: fd.get('nomor_whatsapp').trim()
    };

    // Validasi sederhana
    if (data.password.length < 6) {
      Utils.notify('Password minimal 6 karakter', 'warning');
      return;
    }
    if (!/^[0-9]{8,15}$/.test(data.nomor_whatsapp.replace(/[^0-9]/g, ''))) {
      Utils.notify('Nomor WhatsApp tidak valid', 'warning');
      return;
    }

    const res = await API.call('register', data);
    if (res.success) {
      Utils.notify(res.message, 'success', 5000);
      form.reset();
      setTimeout(() => window.location.href = 'login.html', 2500);
    } else {
      Utils.notify(res.message, 'error');
    }
  });

  // Toggle password visibility
  const toggleBtn = document.getElementById('toggle-password');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const input = document.getElementById('password');
      input.type = input.type === 'password' ? 'text' : 'password';
      toggleBtn.textContent = input.type === 'password' ? '👁️' : '🙈';
    });
  }
});
