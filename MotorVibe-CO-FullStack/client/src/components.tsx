import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleGauge, Clock3, Cpu, Gauge, HeartPulse, MoreHorizontal, Plus, Search, ShieldCheck, Thermometer, Wrench, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { HealthStatus, SensorMeta } from './types'

export function Brand() {
  return <div className="flex items-center gap-3"><div className="brand-mark"><Activity size={21} strokeWidth={2.7}/></div><div><div className="text-[19px] font-extrabold tracking-tight text-white">motor<span className="text-emerald-400">vibe</span></div><div className="text-[9px] tracking-[.2em] uppercase text-slate-500">Motor intelligence</div></div></div>
}
export function StatusPill({ status }: { status: HealthStatus | 'Online' | 'Offline' | 'Warning' | 'Critical' }) {
  const cls = status === 'Healthy' || status === 'Online' ? 'pill-green' : status === 'Warning' ? 'pill-amber' : status === 'Critical' ? 'pill-red' : 'pill-slate'
  return <span className={`status-pill ${cls}`}><span className="pill-dot"/>{status}</span>
}
export function MetricCard({ label, value, unit, note, icon, tone = 'green', trend }: { label: string; value: string | number; unit?: string; note: string; icon: ReactNode; tone?: 'green'|'amber'|'red'|'blue'; trend?: 'up'|'down' }) {
  return <article className="metric-card"><div className="flex items-start justify-between gap-3"><div><p className="metric-label">{label}</p><div className="mt-3 flex items-baseline gap-1"><span className="metric-value">{value}</span>{unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}</div></div><div className={`metric-icon icon-${tone}`}>{icon}</div></div><div className="mt-4 flex items-center gap-2 text-xs text-slate-500">{trend && <span className={trend === 'up' ? 'text-rose-400' : 'text-emerald-400'}>{trend === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}</span>}{note}</div></article>
}
export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="panel-title">{title}</h2>{subtitle && <p className="panel-subtitle">{subtitle}</p>}</div>{action}</div>{children}</section>
}
export function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon"><Activity size={22}/></div><p className="font-semibold text-slate-200">{title}</p><p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p></div>
}
export function SensorCard({ meta, value, unit, detail, abnormal = false }: { meta: SensorMeta; value: string | number; unit: string; detail: string; abnormal?: boolean }) {
  return <article className="sensor-card"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-slate-500">{meta.name}</p><p className={`mt-3 text-2xl font-bold tracking-tight ${abnormal ? 'text-rose-300' : 'text-white'}`}>{value}<span className="ml-1 text-sm font-medium text-slate-500">{unit}</span></p></div><div className="rounded-xl border border-white/[.06] bg-white/[.035] p-2.5 text-emerald-300">{meta.name.toLowerCase().includes('temperature') ? <Thermometer size={18}/> : meta.name.toLowerCase().includes('vibration') ? <Activity size={18}/> : meta.name.toLowerCase().includes('speed') ? <Gauge size={18}/> : <CircleGauge size={18}/>}</div></div><div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-3"><span className="text-[11px] text-slate-500">{detail}</span>{abnormal && <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300"><AlertTriangle size={12}/> Alert</span>}</div></article>
}
export function SmallLabel({ children }: { children: ReactNode }) { return <span className="section-kicker">{children}</span> }
export const icons = { Activity, AlertTriangle, Check, Clock3, Cpu, Gauge, HeartPulse, MoreHorizontal, Plus, Search, ShieldCheck, Thermometer, Wrench, X, ChevronRight }
