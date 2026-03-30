async function sendEmail({ to, toName, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: {
        name:  'ChauBondi',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@chaubondi.app'
      },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error: ${err}`);
  }

  return res.json();
}

function verificationEmailHtml({ nombre, verifyUrl }) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0A0A12;font-family:'DM Sans',Arial,sans-serif;color:#F0F0F5;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <div style="background:#111118;border:1px solid #22222E;border-radius:16px;overflow:hidden;">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0A0A12,#0D1A12);padding:40px 32px;text-align:center;border-bottom:1px solid #22222E;">
        <div style="font-size:3rem;margin-bottom:12px;">🚌</div>
        <h1 style="margin:0;font-size:2.4rem;letter-spacing:0.05em;color:#00E676;">CHAUBONDI</h1>
        <p style="margin:8px 0 0;color:#9898B2;font-size:0.9rem;">Compartí el viaje al Campus Siglo 21</p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <h2 style="margin:0 0 12px;font-size:1.3rem;color:#F0F0F5;">Hola ${nombre} 👋</h2>
        <p style="margin:0 0 24px;color:#9898B2;line-height:1.6;">
          Gracias por registrarte en ChauBondi. Para activar tu cuenta y empezar a compartir viajes,
          necesitamos verificar tu correo institucional.
        </p>

        <div style="text-align:center;margin:28px 0;">
          <a href="${verifyUrl}"
            style="display:inline-block;background:#00E676;color:#000;font-weight:700;font-size:1rem;
                   padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.02em;">
            ✅ Verificar mi cuenta
          </a>
        </div>

        <p style="margin:24px 0 0;color:#5B5B72;font-size:0.8rem;line-height:1.6;">
          Este link expira en <strong style="color:#9898B2;">24 horas</strong>. 
          Si no creaste esta cuenta, podés ignorar este mail.
        </p>

        <div style="margin-top:24px;padding:16px;background:#18181F;border-radius:8px;border:1px solid #22222E;">
          <p style="margin:0;font-size:0.8rem;color:#5B5B72;">
            Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
            <span style="color:#00E676;word-break:break-all;">${verifyUrl}</span>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:20px 32px;border-top:1px solid #22222E;text-align:center;">
        <p style="margin:0;color:#5B5B72;font-size:0.75rem;">
          ChauBondi · Solo para estudiantes de Universidad Siglo 21 Córdoba
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { sendEmail, verificationEmailHtml };
