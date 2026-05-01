var PRESETS = {
  daily_bonus: {
    title:    '🎁 ¡Tu bono diario te espera!',
    body:     'Entra a JUEGALO y reclama tus monedas gratis de hoy.',
    audience: 'unclaimed_bonus'
  },
  new_games: {
    title:    '🎮 ¡Nuevas misiones disponibles!',
    body:     'Instala juegos y gana monedas extra hoy.',
    audience: 'all'
  },
  surveys: {
    title:    '📋 ¡Hay encuestas para ti!',
    body:     'Completa encuestas y gana hasta $0.60 USD cada una.',
    audience: 'all'
  },
  streak: {
    title:    '🔥 ¡No pierdas tu racha!',
    body:     'Entra hoy y mantén tu racha activa. ¡Hay bonos esperandote!',
    audience: 'all'
  },
  ranking: {
    title:    '🏆 ¡El ranking semanal reinicia pronto!',
    body:     'Gana más monedas antes del cierre y llévate el premio.',
    audience: 'all'
  }
};

function showResult(cls, msg) {
  var el = document.getElementById('notify-result');
  if (!el) return;
  el.className = 'notify-result' + (cls ? ' ' + cls : '');
  el.textContent = msg;
}

document.querySelectorAll('.preset-btn[data-preset]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var key = btn.getAttribute('data-preset');
    var p = PRESETS[key];
    if (!p) return;
    document.getElementById('notif-title').value    = p.title;
    document.getElementById('notif-body').value     = p.body;
    document.getElementById('notif-audience').value = p.audience;
    document.querySelectorAll('.preset-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    showResult('', '');
    document.getElementById('notif-title').focus();
  });
});

var sendBtn = document.getElementById('send-notif-btn');
if (sendBtn) {
  sendBtn.addEventListener('click', function() {
    var title    = document.getElementById('notif-title').value.trim();
    var message  = document.getElementById('notif-body').value.trim();
    var audience = document.getElementById('notif-audience').value;
    if (!title || !message) {
      showResult('err', 'Completa el titulo y el mensaje antes de enviar.');
      return;
    }
    showResult('loading', 'Enviando notificacion...');
    fetch('/admin/notify', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: title, message: message, audience: audience })
    })
    .then(function(res) {
      return res.json().then(function(data) {
        if (res.ok) {
          showResult('ok', 'Enviada a ' + data.sent + ' de ' + data.total + ' dispositivos.');
          document.querySelectorAll('.preset-btn').forEach(function(b) { b.classList.remove('active'); });
        } else {
          showResult('err', 'Error: ' + (data.error || 'desconocido'));
        }
      });
    })
    .catch(function() {
      showResult('err', 'Error de red. Intenta de nuevo.');
    });
  });
}
