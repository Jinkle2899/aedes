import { useNavigate } from 'react-router-dom'
import { templateRecipe } from '../data.js'
import { createFromTemplate } from '../lib/db.js'
import { cloudEnabled } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.jsx'

export default function TemplateCard({ t }) {
  const navigate = useNavigate()
  const { session } = useAuth()

  const useTemplate = async (e) => {
    e.preventDefault()
    if (cloudEnabled && !session) {
      navigate('/app') // sign in first; dashboard shows the auth screen
      return
    }
    const site = await createFromTemplate(t.name, templateRecipe(t), t.tag, session)
    navigate(`/app/editor/${site.id}`)
  }

  return (
    <a className="tpl" href="/app" onClick={useTemplate}>
      <div className={`tpl-preview v-${t.variant}`}>
        <span className="sk sk-nav" />
        <span className="sk sk-hero" />
        <span className="sk sk-line w70" />
        <span className="sk sk-line w45" />
        <div className="sk-row">
          <span className="sk sk-cell" />
          <span className="sk sk-cell" />
          <span className="sk sk-cell" />
        </div>
      </div>
      <div className="tpl-meta">
        <div>
          <strong>{t.name}</strong>
          <span>{t.tag}</span>
        </div>
        <em>Use template →</em>
      </div>
    </a>
  )
}
