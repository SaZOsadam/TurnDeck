exports.handler = async (event) => {
  const { cc = 'us', type = 'topsongs', limit = '25' } = event.queryStringParameters || {}

  const safeCC = cc.replace(/[^a-z]/gi, '').toLowerCase().slice(0, 3)
  const safeType = ['topsongs', 'topalbums'].includes(type) ? type : 'topsongs'
  const safeLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50)

  const url = `https://itunes.apple.com/${safeCC}/rss/${safeType}/limit=${safeLimit}/json`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TurnDeck/1.0' },
    })

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: `iTunes returned ${res.status}` }),
      }
    }

    const data = await res.json()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
