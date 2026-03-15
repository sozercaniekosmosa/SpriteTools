

import { cn } from '@shared/lib/clsx/clsx'
import './index.css'
import { CocosExtractor } from '@shared/ui'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@features/language-switcher'

function App() {
  const { t } = useTranslation();

  return (
    <div className={cn('min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 relative')}>
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <div className={cn('w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700 flex flex-col items-center gap-6')}>
        <h1 className={cn('text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent')}>
          {t('title')}
        </h1>

        <p className={cn('text-slate-400 text-center')}>
          {t('description')}
        </p>

        <div className={cn('flex flex-col items-center gap-2 w-full')}>
          <CocosExtractor />
        </div>
      </div>
    </div>
  )
}

export default App
