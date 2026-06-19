import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<string, string> = {
  primary: 'bg-accent text-paper-raised hover:bg-accent-ink',
  secondary: 'bg-paper-raised text-ink border border-line hover:border-accent',
  ghost: 'text-ink-soft hover:text-ink hover:bg-paper-raised',
  danger: 'bg-danger text-paper-raised hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}
