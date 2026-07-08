import { NavLink } from 'react-router-dom'
import { BarChart3, Bookmark, ShieldAlert, TrainFront } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import AccountMenu from './AccountMenu'

const linkBase = 'flex min-w-fit items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition border'
const inactive = 'border-transparent text-slate-300 hover:border-cyan-400/20 hover:bg-slate-900'
const active = 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'

function LinkItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
      <Icon size={16} />
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )
}

export default function Navbar({ language, onLanguageChange, labels, onOpenProfile }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between">
        <NavLink to="/" className="flex min-w-0 items-center gap-2 font-black tracking-tight text-slate-50">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/30">
            <TrainFront size={20} />
          </span>
          <span className="truncate">TravelMate</span>
          <span className="hidden rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-xs text-yellow-200 md:inline">
            Emergency Travel Intelligence
          </span>
        </NavLink>

        <nav className="flex max-w-full items-center gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Main navigation">
          <LanguageSelector language={language} onChange={onLanguageChange} />
          <LinkItem to="/safety" icon={ShieldAlert} label={labels.safety} />
          <LinkItem to="/planner" icon={TrainFront} label={labels.planner} />
          <LinkItem to="/saved" icon={Bookmark} label={labels.saved} />
          <LinkItem to="/analyze" icon={BarChart3} label={labels.analyze} />
          <AccountMenu onOpenProfile={onOpenProfile} />
        </nav>
      </div>
    </header>
  )
}
