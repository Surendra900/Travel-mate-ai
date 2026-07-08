export default async function handler(req, res) {
  const { from = '', to = '', date = '' } = req.query
  const apiUrl = process.env.BUS_API_URL
  const apiKey = process.env.BUS_API_KEY

  if (!apiUrl || !apiKey) {
    return res.status(200).json({
      ok: true,
      mode: 'fallback',
      provider: 'Local route dataset',
      message: 'Live bus API is not configured. Bus providers usually require partner access, so local fallback remains active.',
      results: []
    })
  }

  try {
    const url = new URL(apiUrl)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    if (date) url.searchParams.set('date', date)
    const response = await fetch(url.toString(), { headers: { Authorization: `Bearer ${apiKey}`, 'x-api-key': apiKey } })
    const payload = await response.json()
    return res.status(200).json({ ok: response.ok, mode: response.ok ? 'live' : 'fallback', provider: 'Configured bus provider', message: response.ok ? 'Bus provider response loaded.' : 'Bus provider returned an error.', results: payload?.results || payload?.data || [], raw: payload })
  } catch (error) {
    return res.status(200).json({ ok: true, mode: 'fallback', provider: 'Local route dataset', message: `Bus API error: ${error.message}. Use local catalogue results.`, results: [] })
  }
}
