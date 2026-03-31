async function sendEmail({ to, toName, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'ChauBondi', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html
    })
  });
  if (!res.ok) throw new Error(`Brevo error: ${await res.text()}`);
  return res.json();
}

function baseTemplate({ titulo, subtitulo, cuerpo, botonUrl, botonTexto, footer }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0A0A12;font-family:Arial,sans-serif;color:#F0F0F5;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <div style="background:#111118;border:1px solid #22222E;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0A0A12,#0D1A12);padding:36px 32px;text-align:center;border-bottom:1px solid #22222E;">
        <div style="font-size:2.5rem;margin-bottom:10px;">🚌</div>
        <h1 style="margin:0;font-size:1.8rem;letter-spacing:0.05em;color:#00E676;">CHAUBONDI</h1>
        <p style="margin:6px 0 0;color:#9898B2;font-size:0.82rem;">${subtitulo}</p>
      </div>
      <div style="padding:28px 32px;">
        <h2 style="margin:0 0 10px;font-size:1.1rem;color:#F0F0F5;">${titulo}</h2>
        <div style="color:#9898B2;line-height:1.7;font-size:0.92rem;">${cuerpo}</div>
        ${botonUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${botonUrl}" style="display:inline-block;background:#00E676;color:#000;font-weight:700;font-size:0.95rem;padding:13px 28px;border-radius:8px;text-decoration:none;">${botonTexto}</a>
        </div>
        <div style="padding:12px;background:#18181F;border-radius:8px;border:1px solid #22222E;">
          <p style="margin:0;font-size:0.72rem;color:#5B5B72;">Si el botón no funciona copiá este link:<br/><span style="color:#00E676;word-break:break-all;">${botonUrl}</span></p>
        </div>` : ''}
      </div>
      <div style="padding:14px 32px;border-top:1px solid #22222E;text-align:center;">
        <p style="margin:0;color:#5B5B72;font-size:0.7rem;">${footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function verificationEmailHtml({ nombre, verifyUrl }) {
  return baseTemplate({
    subtitulo: 'Verificá tu cuenta para empezar',
    titulo:    `¡Hola ${nombre}! 👋`,
    cuerpo:    `Gracias por sumarte a ChauBondi. Para activar tu cuenta hacé clic en el botón.<br/><br/>El link es válido por <strong style="color:#F0F0F5;">24 horas</strong>.`,
    botonUrl:  verifyUrl,
    botonTexto: '✅ Verificar mi cuenta',
    footer:    'Si no creaste esta cuenta ignorá este mail · ChauBondi'
  });
}

function resetPasswordEmailHtml({ nombre, resetUrl }) {
  return baseTemplate({
    subtitulo: 'Recuperá el acceso a tu cuenta',
    titulo:    `Hola ${nombre}, ¿olvidaste tu contraseña?`,
    cuerpo:    `Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste vos, hacé clic en el botón.<br/><br/>Este link expira en <strong style="color:#F0F0F5;">1 hora</strong>. Si no lo pediste, ignorá este mail.`,
    botonUrl:  resetUrl,
    botonTexto: '🔑 Restablecer contraseña',
    footer:    'Por seguridad este link expira en 1 hora · ChauBondi'
  });
}

module.exports = { sendEmail, verificationEmailHtml, resetPasswordEmailHtml };
