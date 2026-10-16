import * as Tabs from '@radix-ui/react-tabs'
import clsx from 'clsx'
import { LiveDashboard } from './components/LiveDashboard'
import { RollingRadar } from './components/RollingRadar'
import { TrajectoryChart } from './components/TrajectoryChart'
import { ReconciliationView } from './components/ReconciliationView'
import { DebtEngineCard } from './components/DebtEngineCard'
import { DataManager } from './components/DataManager'

const TABS = [
  { value: 'live', label: 'Today' },
  { value: 'radar', label: '30-Day Radar' },
  { value: 'trajectory', label: 'Trajectory' },
  { value: 'reconcile', label: 'Reconcile' },
  { value: 'debt', label: 'Debt' },
  { value: 'data', label: 'Data' },
] as const

function App() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-24 pt-8">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">Zero-Based Net Liquidity</p>
        <h1 className="text-2xl font-semibold text-text">True Cash</h1>
      </header>

      <Tabs.Root defaultValue="live" className="flex flex-1 flex-col">
        <div className="flex-1">
          <Tabs.Content value="live">
            <LiveDashboard />
          </Tabs.Content>
          <Tabs.Content value="radar">
            <RollingRadar />
          </Tabs.Content>
          <Tabs.Content value="trajectory">
            <TrajectoryChart />
          </Tabs.Content>
          <Tabs.Content value="reconcile">
            <ReconciliationView />
          </Tabs.Content>
          <Tabs.Content value="debt">
            <DebtEngineCard />
          </Tabs.Content>
          <Tabs.Content value="data">
            <DataManager />
          </Tabs.Content>
        </div>

        <Tabs.List
          className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-2xl gap-1 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur"
          aria-label="Views"
        >
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className={clsx(
                'flex-1 rounded-xl px-2 py-2 text-center text-xs font-medium text-text-muted transition-colors',
                'data-[state=active]:bg-surface-raised data-[state=active]:text-text',
              )}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  )
}

export default App
