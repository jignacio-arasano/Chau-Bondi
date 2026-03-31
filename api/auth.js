const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const supabase = require('./_lib/db');
const { withCors, withAuth } = require('./_lib/middleware');
const { sendEmail, verificationEmailHtml } = require('./_lib/email');
const { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } = require('./_lib/email');
/*const DOMINIO = '@soysiglo.21.edu.ar';*/

module.exports = withCors(async (req, res) => {
  const url = req.url.split('?')[0].replace(/\/$/, '');

  // ── POST /api/auth/register ────────────────────────────────────────────────
  if (url.endsWith('/register') && req.method === 'POST') {
    
    try {
      const { email, password, nombre, apellido, whatsapp } = req.body || {};
      if (!email || !password || !nombre || !apellido || !whatsapp)
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      //FUNCION SOLO DOMINIO INSTITUCIONAL DESACTIVADA
      /*if (!email.toLowerCase().endsWith(DOMINIO))
        return res.status(400).json({ error: `Solo se permiten correos ${DOMINIO}` });*/
      if (password.length < 6)
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      const waClean = whatsapp.replace(/\D/g, '');
      if (waClean.length < 10)
        return res.status(400).json({ error: 'Número de WhatsApp inválido.' });
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).single();
      if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
      const password_hash        = await bcrypt.hash(password, 12);
      const verification_token   = crypto.randomBytes(32).toString('hex');
      const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { data: profile, error } = await supabase.from('profiles')
        .insert({ email: email.toLowerCase(), password_hash, nombre: nombre.trim(),
          apellido: apellido.trim(), whatsapp: waClean,
          email_verified: false, verification_token, verification_expires })
        .select('id, email, nombre, apellido').single();
      if (error) throw error;
      const verifyUrl = `${process.env.FRONTEND_URL}/verify?token=${verification_token}`;
      await sendEmail({ to: profile.email, toName: `${profile.nombre} ${profile.apellido}`,
        subject: '✅ Verificá tu cuenta de ChauBondi',
        html: verificationEmailHtml({ nombre: profile.nombre, verifyUrl }) });
      return res.status(201).json({ message: 'Cuenta creada. Revisá tu correo para verificarla.' });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Error al crear la cuenta.' });
    }
    
  }

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  if (url.endsWith('/login') && req.method === 'POST') {
    try {
      const { email, password } = req.body || {};
      if (!email || !password)
        return res.status(400).json({ error: 'Email y contraseña requeridos.' });

      const { data: profile, error } = await supabase.from('profiles')
        .select('id, email, nombre, apellido, whatsapp, rating_promedio, password_hash, activo, email_verified')
        .eq('email', email.toLowerCase()).single();

      if (error || !profile)
        return res.status(401).json({ error: 'Credenciales incorrectas.' });
      if (!profile.activo)
        return res.status(403).json({ error: 'Tu cuenta está suspendida.' });
      if (profile.email_verified === false)
        return res.status(403).json({ error: 'Verificá tu correo antes de ingresar.', code: 'EMAIL_NOT_VERIFIED' });

      const ok = await bcrypt.compare(password, profile.password_hash);
      if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas.' });

      const token = jwt.sign(
        { id: profile.id, email: profile.email, nombre: profile.nombre, apellido: profile.apellido },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      const { password_hash, ...userPublic } = profile;
      return res.json({ token, user: userPublic });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
  }

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  if (url.endsWith('/me') && req.method === 'GET') {
    return withAuth(async (req, res) => {
      try {
        const { data: profile, error } = await supabase.from('profiles')
          .select('id, email, nombre, apellido, whatsapp, rating_promedio, rating_count, created_at')
          .eq('id', req.user.id).single();
        if (error || !profile) return res.status(404).json({ error: 'Perfil no encontrado.' });
        return res.json(profile);
      } catch (err) {
        return res.status(500).json({ error: 'Error al obtener el perfil.' });
      }
    })(req, res);
  }

  // ── GET /api/auth/verify ───────────────────────────────────────────────────
  if (url.endsWith('/verify') && req.method === 'GET') {
    try {
      const token = req.query?.token || new URL(req.url, 'http://x').searchParams.get('token');
      if (!token) return res.status(400).json({ error: 'Token requerido.' });

      const { data: profile, error } = await supabase.from('profiles')
        .select('id, email_verified, verification_expires')
        .eq('verification_token', token).single();

      if (error || !profile) return res.status(400).json({ error: 'Token inválido o ya utilizado.' });
      if (profile.email_verified) return res.json({ message: 'Tu cuenta ya estaba verificada. Podés iniciar sesión.' });
      if (new Date(profile.verification_expires) < new Date())
        return res.status(400).json({ error: 'El link de verificación expiró. Contactá al administrador.' });

      await supabase.from('profiles')
        .update({ email_verified: true, verification_token: null, verification_expires: null })
        .eq('id', profile.id);

      return res.json({ message: '✅ ¡Cuenta verificada! Ya podés iniciar sesión en ChauBondi.' });
    } catch (err) {
      console.error('Verify error:', err);
      return res.status(500).json({ error: 'Error al verificar la cuenta.' });
    }
  }
  // ── POST /api/auth/forgot-password ─────────────────────────────────────────
  if (url.endsWith('/forgot-password') && req.method === 'POST') {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ error: 'Email requerido.' });

      const { data: p } = await supabase.from('profiles')
        .select('id, nombre, apellido, email').eq('email', email.toLowerCase()).single();

      // Siempre devolvemos 200 para no revelar si el mail existe por seguridad
      if (!p) return res.json({ message: 'Si ese correo existe, recibirás un link para restablecer tu contraseña.' });

      const reset_token   = crypto.randomBytes(32).toString('hex');
      const reset_expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

      await supabase.from('profiles')
        .update({ reset_token, reset_expires })
        .eq('id', p.id);

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${reset_token}`;
      await sendEmail({
        to:      p.email,
        toName:  `${p.nombre} ${p.apellido}`,
        subject: '🔑 Restablecé tu contraseña de ChauBondi',
        html:    resetPasswordEmailHtml({ nombre: p.nombre, resetUrl })
      });

      return res.json({ message: 'Si ese correo existe, recibirás un link para restablecer tu contraseña.' });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Error al procesar la solicitud.' });
    }
  }

  // ── POST /api/auth/reset-password ──────────────────────────────────────────
  if (url.endsWith('/reset-password') && req.method === 'POST') {
    try {
      const { token, password } = req.body || {};
      if (!token || !password)
        return res.status(400).json({ error: 'Token y contraseña requeridos.' });
      if (password.length < 6)
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });

      const { data: p } = await supabase.from('profiles')
        .select('id, reset_expires').eq('reset_token', token).single();

      if (!p) return res.status(400).json({ error: 'Token inválido o ya utilizado.' });
      if (new Date(p.reset_expires) < new Date())
        return res.status(400).json({ error: 'El link expiró. Solicitá uno nuevo.' });

      const password_hash = await bcrypt.hash(password, 12);
      await supabase.from('profiles')
        .update({ password_hash, reset_token: null, reset_expires: null })
        .eq('id', p.id);

      return res.json({ message: '✅ Contraseña actualizada. Ya podés iniciar sesión.' });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).json({ error: 'Error al restablecer la contraseña.' });
    }
  }
  return res.status(404).json({ error: 'Ruta no encontrada.' });
});
