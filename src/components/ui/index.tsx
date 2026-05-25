import React from 'react'
import { Loader2 } from 'lucide-react'

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'muted' | 'ink'
interface BadgeProps { variant?: BadgeVariant; children: React.ReactNode; dot?: boolean }

const badgeStyles: Record<BadgeVariant, React.CSSProperties> = {
  green:  { background: 'var(--green-light)', color: 'var(--green)' },
  red:    { background: 'var(--red-light)', color: 'var(--red)' },
  amber:  { background: 'var(--amber-light)', color: 'var(--amber)' },
  blue:   { background: 'var(--blue-light)', color: 'var(--blue)' },
  muted:  { background: 'var(--line)', color: 'var(--ink-3)' },
  ink:    { background: 'var(--ink)', color: 'var(--white)' },
}

export function Badge({ variant = 'muted', children, dot }: BadgeProps) {
  return (
    <span style={{
      ...badgeStyles[variant],
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; className?: string }
export function Card({ children, style, onClick, className }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--white)', borderRadius: 'var(--radius)',
        border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)',
        padding: 24, cursor: onClick ? 'pointer' : undefined,
        transition: 'box-shadow 0.15s, transform 0.15s',
        ...(onClick ? { ':hover': { boxShadow: 'var(--shadow)' } } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
interface BtnProps {
  variant?: BtnVariant; children: React.ReactNode; onClick?: () => void;
  disabled?: boolean; loading?: boolean; icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg'; style?: React.CSSProperties; type?: 'button' | 'submit'
}

const btnStyles: Record<BtnVariant, React.CSSProperties> = {
  primary:   { background: 'var(--ink)', color: 'var(--white)', border: '1.5px solid var(--ink)' },
  secondary: { background: 'var(--white)', color: 'var(--ink)', border: '1.5px solid var(--line)' },
  ghost:     { background: 'transparent', color: 'var(--ink-3)', border: '1.5px solid transparent' },
  danger:    { background: 'var(--red)', color: 'var(--white)', border: '1.5px solid var(--red)' },
  success:   { background: 'var(--green)', color: 'var(--white)', border: '1.5px solid var(--green)' },
}

const btnSizes: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: 13, borderRadius: 8 },
  md: { padding: '9px 18px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '12px 24px', fontSize: 15, borderRadius: 12 },
}

export function Button({ variant = 'primary', children, onClick, disabled, loading, icon, size = 'md', style, type = 'button' }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...btnStyles[variant], ...btnSizes[size],
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontWeight: 600, cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s', userSelect: 'none',
        ...style,
      }}
    >
      {loading ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : icon}
      {children}
    </button>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatProps {
  label: string; value: string | number; sub?: string;
  icon?: React.ReactNode; color?: string; trend?: 'up' | 'down'
}
export function StatCard({ label, value, sub, icon, color = 'var(--ink)', trend }: StatProps) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</p>
          {sub && <p style={{ fontSize: 13, color: trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--muted)' }}>{sub}</p>}
        </div>
        {icon && (
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--muted)' }} />
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string; placeholder?: string; value: string; onChange: (v: string) => void;
  type?: string; error?: string; icon?: React.ReactNode; disabled?: boolean; required?: boolean; style?: React.CSSProperties
}
export function Input({ label, placeholder, value, onChange, type = 'text', error, icon, disabled, required }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex' }}>{icon}</span>}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          style={{
            width: '100%', padding: icon ? '10px 14px 10px 40px' : '10px 14px',
            border: `1.5px solid ${error ? 'var(--red)' : 'var(--line)'}`,
            borderRadius: 10, fontSize: 14, color: 'var(--ink)',
            background: disabled ? 'var(--surface)' : 'var(--white)',
            outline: 'none', transition: 'border-color 0.15s',
          }}
        />
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string; disabled?: boolean
}
export function Select({ label, value, onChange, options, placeholder, disabled }: SelectProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        style={{
          padding: '10px 14px', border: '1.5px solid var(--line)',
          borderRadius: 10, fontSize: 14, color: value ? 'var(--ink)' : 'var(--muted)',
          background: 'var(--white)', outline: 'none', cursor: 'pointer', width: '100%',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number }
export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-in"
        style={{
          background: 'var(--white)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: width,
          maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: 20, lineHeight: 1, cursor: 'pointer', background: 'none', border: 'none' }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', color: 'var(--muted)' }}>
      {icon && <div style={{ marginBottom: 16, opacity: 0.4 }}>{icon}</div>}
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 6 }}>{title}</p>
      {description && <p style={{ fontSize: 14, marginBottom: 20 }}>{description}</p>}
      {action}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────
interface Col<T> { key: string; header: string; render?: (row: T) => React.ReactNode; width?: number | string }
interface TableProps<T> { columns: Col<T>[]; data: T[]; onRowClick?: (row: T) => void; keyField?: string }

export function Table<T extends Record<string, unknown>>({ columns, data, onRowClick, keyField = 'id' }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--line)' }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row[keyField] as string || i}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: '1px solid var(--surface)',
                cursor: onRowClick ? 'pointer' : undefined,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                  {col.render ? col.render(row) : row[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color = 'var(--green)' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ background: 'var(--line)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 36, color = 'var(--green)' }: { name: string; size?: number; color?: string }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color + '22',
      color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}
