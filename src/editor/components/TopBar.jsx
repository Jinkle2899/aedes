import { Link } from 'react-router-dom'
import { FONTS } from '../constants.js'

/* ---------------- Editor top bar ---------------- */
export default function TopBar({
  site,
  patchSite,
  saveState,
  device,
  setDevice,
  predictOn,
  togglePredict,
  preview,
  onTogglePreview,
  publish,
}) {
  return (
    <header className="ed-top">
      <div className="ed-top-left">
        <Link to="/app" className="ed-back" title="Back to sites">←</Link>
        <input
          className="ed-name"
          value={site.name}
          onChange={(e) => patchSite({ name: e.target.value })}
          aria-label="Site name"
        />
        <span className={`ed-saved${saveState === 'error' ? ' err' : ''}`}>
          {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved'}
        </span>
        <select
          className="ed-font"
          title="Site font"
          value={site.font || 'Inter'}
          onChange={(e) => patchSite({ font: e.target.value === 'Inter' ? null : e.target.value })}
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="ed-device" role="group" aria-label="Device preview">
        <button type="button" className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')} title="Desktop">▭</button>
        <button type="button" className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')} title="Mobile">▯</button>
      </div>
      <div className="ed-top-right">
        <button
          type="button"
          className={`ed-predict${predictOn ? ' on' : ''}`}
          onClick={togglePredict}
          title={predictOn ? 'Predictive suggestions: on' : 'Predictive suggestions: off'}
        >
          ⌁
        </button>
        <button type="button" className="ed-ghost" onClick={onTogglePreview}>
          {preview ? 'Exit preview' : 'Preview'}
        </button>
        <button type="button" className="ed-publish" onClick={publish}>Publish</button>
      </div>
    </header>
  )
}
