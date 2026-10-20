export default async function handler(req, res) {
  // 1. Check the PIN sent by the admin page
  const pin = req.headers['x-admin-pin'];
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, product, id } = req.body;

  // --- NEW: Just check if the PIN is valid and return ---
  if (action === 'verify') {
    return res.status(200).json({ message: 'PIN valid' });
  }
  // -------------------------------------------------------

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const baseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  let response;

  if (action === 'create') {
    response = await fetch(`${supabaseUrl}/rest/v1/products`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify(product),
    });
  } else if (action === 'update') {
    response = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${id}`, {
      method: 'PATCH',
      headers: baseHeaders,
      body: JSON.stringify(product),
    });
  } else if (action === 'delete') {
    response = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${id}`, {
      method: 'DELETE',
      headers: baseHeaders,
    });
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  return res.status(200).json(data);
}