import { useState, ChangeEvent } from 'react'
import './App.css'

interface AppResult {
  url: string;
  hash: string;
  existing?: boolean;
}

const ApiIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '12px' }}>
    <path d="M7 8L3 12L7 16" stroke="#646cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8L21 12L17 16" stroke="#646cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 4L10 20" stroke="#646cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function App() {
  const [method, setMethod] = useState('GET')
  const [responseType, setResponseType] = useState('JSON')
  const [statusCode, setStatusCode] = useState(200)
  const [body, setBody] = useState('')
  const [result, setResult] = useState<AppResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const base64Body = btoa(unescape(encodeURIComponent(body)))

      const response = await fetch('/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          response_type: responseType,
          response_code: statusCode,
          response_body: base64Body
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create endpoint')
      }

      const data = (await response.json()) as AppResult;
      setResult({ url: data.url, hash: data.hash, existing: data.existing })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="app-header">
        <ApiIcon />
        <div>
          <h1>MockAPI</h1>
          <p className="subtitle">Instant endpoints for your development needs.</p>
        </div>
      </header>

      <div className="card">
        <div className="field">
          <label>HTTP Method</label>
          <select value={method} onChange={(e: ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value)}>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
        </div>

        <div className="field">
          <label>Response Type</label>
          <select value={responseType} onChange={(e: ChangeEvent<HTMLSelectElement>) => setResponseType(e.target.value)}>
            <option>JSON</option>
            <option>XML</option>
            <option>Plain Text</option>
          </select>
        </div>

        <div className="field">
          <label>HTTP Status Code</label>
          <input 
            type="number" 
            value={statusCode} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStatusCode(Number(e.target.value))} 
          />
        </div>

        <div className="field full-width">
          <label>Response Body</label>
          <textarea 
            placeholder="Enter response body..."
            value={body}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
          />
        </div>

        <div className="field full-width">
          <button onClick={handleCreate} disabled={loading} className="primary-button">
            {loading ? 'Creating...' : 'Create API'}
          </button>
        </div>

        {error && <p className="error-text full-width">{error}</p>}

        <div className="field full-width">
          <div className="result">
            {result ? (
              <>
                <p style={{ margin: '0 0 0.8rem', fontSize: '0.85rem', color: '#aaa' }}><strong>Generated URL:</strong></p>
                <div className="url-box">
                  <a href={result.url} target="_blank" rel="noreferrer">{result.url}</a>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
                Your generated URL will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
