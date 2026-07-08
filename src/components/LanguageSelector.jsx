import { languages } from '../data/languageData'

export default function LanguageSelector({ language, onChange }) {
  return (
    <select
      className="rounded-full border border-cyan-400/20 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none"
      value={language}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Select language"
    >
      {Object.entries(languages).map(([code, item]) => (
        <option key={code} value={code}>{item.name}</option>
      ))}
    </select>
  )
}
