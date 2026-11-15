import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <p className="not-found-kicker">MARSCRAFT MISSION CONTROL</p>
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1 className="not-found-title" id="not-found-title">Signal lost</h1>
        <p className="not-found-description">
          This page is outside the mission map. Return to the MarsCraft landing zone to continue.
        </p>
        <Link className="not-found-link" href="/">RETURN TO MISSION</Link>
      </section>
    </main>
  );
}
