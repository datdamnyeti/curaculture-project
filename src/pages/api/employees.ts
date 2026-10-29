// The roster: who gets a survey link, and the clinic's headcount.
import { api, ADMIN_ROLES, HttpError, requireClinic, requireUser } from '@/lib/server/http';
import { supabaseAdmin } from '@/lib/server/supabaseAdmin';

interface Row { name?: unknown; email?: unknown; phone?: unknown; roleCode?: unknown }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(r: Row) {
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, 120) : '';
  if (!name) throw new HttpError(400, 'Every person needs a name.');
  const email = typeof r.email === 'string' && r.email.trim() ? r.email.trim().toLowerCase() : null;
  if (email && !EMAIL.test(email)) throw new HttpError(400, `Check the email for ${name}.`);
  const phone = typeof r.phone === 'string' && r.phone.trim() ? r.phone.trim() : null;
  if (phone && (phone.replace(/\D/g, '').length < 10)) throw new HttpError(400, `Check the mobile number for ${name}.`);
  const role = r.roleCode == null || r.roleCode === '' ? null : Number(r.roleCode);
  if (role !== null && !(Number.isInteger(role) && role >= 1 && role <= 8)) throw new HttpError(400, 'Unknown role.');
  return { name, email, phone, role_code: role };
}

export default api({
  async GET(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id);
    const { data, error } = await supabaseAdmin().from('employees').select('id, name, email, phone, role_code')
      .eq('clinic_id', clinicId).eq('active', true).order('name');
    if (error) throw error;
    res.json({ employees: data });
  },

  async POST(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id, ADMIN_ROLES);
    const rows: Row[] = Array.isArray(req.body?.rows) ? req.body.rows : [req.body || {}];
    if (rows.length > 500) throw new HttpError(400, 'Import up to 500 people at a time.');
    const insert = rows.map((r) => ({ ...clean(r), clinic_id: clinicId }));
    const { data, error } = await supabaseAdmin().from('employees').insert(insert).select('id, name, email, phone, role_code');
    if (error) throw error;
    res.status(201).json({ employees: data });
  },

  async DELETE(req, res) {
    const user = await requireUser(req);
    const { clinicId } = await requireClinic(user.id, ADMIN_ROLES);
    const id = req.query.id;
    if (typeof id !== 'string') throw new HttpError(400, 'Missing id.');
    // Soft delete: past invitations keep their headcount history.
    const { error } = await supabaseAdmin().from('employees').update({ active: false }).eq('id', id).eq('clinic_id', clinicId);
    if (error) throw error;
    res.status(204).end();
  },
});
