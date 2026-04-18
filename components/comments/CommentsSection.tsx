'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { AddressAvatar } from '@/components/AddressAvatar';
import { shortenAddress } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/auth/useAuth';
import { getSeededComments, type MockComment } from './mock-comments';

interface Props {
  postId: string;
}

export function CommentsSection({ postId }: Props) {
  const { t } = useI18n();
  const { address } = useAuth();
  const [userComments, setUserComments] = useState<MockComment[]>([]);
  const [input, setInput] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const seededComments = getSeededComments(postId);
  const allComments = [...userComments, ...seededComments];

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!mobileOpen) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !address) return;

    const newComment: MockComment = {
      id: `user-${Date.now()}`,
      address,
      text,
      timeAgo: t('comments.justNow'),
    };
    setUserComments((prev) => [newComment, ...prev]);
    setInput('');
  };

  const panelContent = (
    <>
      <div className="comments-panel__header">
        <svg className="comments-panel__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h3 className="comments-panel__title">{t('comments.title')}</h3>
        <span className="comments-panel__count">{allComments.length}</span>
        <button className="comments-panel__close comments-panel__close--mobile" onClick={() => setMobileOpen(false)} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button className="comments-panel__close comments-panel__close--desktop" onClick={() => setDesktopOpen(false)} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <ul className="comments-panel__list">
        {allComments.map((comment) => {
          const isUser = comment.id.startsWith('user-');
          return (
            <li key={comment.id} className={`comments-panel__item${isUser ? ' comments-panel__item--user' : ''}`}>
              <AddressAvatar address={comment.address} size={28} className="comments-panel__avatar" />
              <div className="comments-panel__body">
                <span className="comments-panel__author">{shortenAddress(comment.address)}</span>
                <p className="comments-panel__text">{comment.text}</p>
              </div>
              <span className="comments-panel__time">{comment.timeAgo}</span>
            </li>
          );
        })}
      </ul>

      <form className="comments-panel__form" onSubmit={handleSubmit}>
        <input
          className="comments-panel__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={address ? t('comments.placeholder') : t('comments.loginToComment')}
          disabled={!address}
          maxLength={280}
        />
        <button
          className="comments-panel__submit"
          type="submit"
          disabled={!address || !input.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </>
  );

  return (
    <>
      {/* Desktop: panel with toggle */}
      <div className={`comments-panel comments-panel--desktop${desktopOpen ? ' comments-panel--open' : ''}`}>
        {panelContent}
      </div>

      {!desktopOpen && (
        <button
          className="comments-toggle comments-toggle--desktop"
          onClick={() => setDesktopOpen(true)}
          aria-label={t('comments.title')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="comments-toggle__count">{allComments.length}</span>
        </button>
      )}

      {/* Mobile: toggle button + bottom sheet */}
      <button
        className="comments-toggle comments-toggle--mobile"
        onClick={() => setMobileOpen(true)}
        aria-label={t('comments.title')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="comments-toggle__count">{allComments.length}</span>
      </button>

      {mobileOpen && <div className="comments-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className={`comments-panel comments-panel--mobile${mobileOpen ? ' comments-panel--open' : ''}`}>
        <div className="comments-panel__handle" />
        {panelContent}
      </div>
    </>
  );
}
