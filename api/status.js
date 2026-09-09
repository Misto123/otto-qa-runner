// Vercel Serverless Function - Check Status
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const API_URL = process.env.REMOTE_BROWSER_API_URL || 'http://65.21.199.228:3000';
    const API_KEY = process.env.REMOTE_BROWSER_API_KEY;

    const response = await fetch(`${API_URL}/browsers/status`, {
      headers: {
        'x_api_key': API_KEY
      }
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 400).json(data);
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
