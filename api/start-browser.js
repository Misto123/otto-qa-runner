// Vercel Serverless Function - Start Browser
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const API_URL = process.env.REMOTE_BROWSER_API_URL || 'http://65.21.199.228:3000';
    const API_KEY = process.env.REMOTE_BROWSER_API_KEY;

    const response = await fetch(`${API_URL}/browsers/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x_api_key': API_KEY
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    if (!data.success) {
      return res.status(400).json(data);
    }

    // Add API key to puppeteerUrl
    const { puppeteerUrl, ...rest } = data.data;
    const urlWithKey = `${puppeteerUrl}?x_api_key=${API_KEY}`;

    return res.status(200).json({
      success: true,
      data: {
        ...rest,
        puppeteerUrl: urlWithKey // Pre-authenticated URL
      }
    });
  } catch (error) {
    console.error('Start browser error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
