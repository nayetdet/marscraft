'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readLanguagePreference, translate, type Language } from '../ui/i18n.ts';

export default function NotFound() {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = readLanguagePreference(window.localStorage);
      setLanguage(saved);
      document.documentElement.lang = saved;
    } catch {
      // English is the safe fallback when browser storage is unavailable.
    }
  }, []);

  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <p className="not-found-kicker">{translate('MARSCRAFT MISSION CONTROL', language)}</p>
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1 className="not-found-title" id="not-found-title">{translate('Signal lost', language)}</h1>
        <p className="not-found-description">
          {translate('This page is outside the mission map. Return to the MarsCraft landing zone to continue.', language)}
        </p>
        <Link className="not-found-link" href="/">{translate('RETURN TO MISSION', language)}</Link>
      </section>
    </main>
  );
}
