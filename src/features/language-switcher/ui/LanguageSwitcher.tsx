import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/clsx/clsx';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  const languages = [
    { code: 'ru', label: 'RU' },
    { code: 'cn', label: 'CN' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={cn(
            'px-3 py-1 text-xs font-bold rounded-md transition-all border',
            currentLanguage.startsWith(lang.code)
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};
