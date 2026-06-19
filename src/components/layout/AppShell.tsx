import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <TopBar title={title} />
      <main className="mx-auto max-w-md px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  )
}
