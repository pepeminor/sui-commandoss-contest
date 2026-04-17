'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LoginButton } from './LoginButton';
import { useAuth } from '@/auth/useAuth';

export function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  const links = [
    { href: '/', label: 'Feed' },
    ...(isLoggedIn ? [
      { href: '/create', label: 'Publish' },
      { href: '/library', label: 'Library' },
    ] : []),
  ];

  return (
    <nav className="navbar">
      <Link href="/" className="navbar__logo">
        <div className="navbar__logo-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" fill="none" />
            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <span className="navbar__logo-name">Verse</span>
      </Link>

      <div className="navbar__links">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`navbar__link${pathname === href ? ' navbar__link--active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="navbar__right">
        <LoginButton />
      </div>
    </nav>
  );
}
