'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
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
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const seededComments = getSeededComments(postId);
  const allComments = [...userComments, ...seededComments];

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

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

  return (
    <>
      {/* Toggle button */}
      <button
        className={`comments-toggle${open ? ' comments-toggle--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('comments.title')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="comments-toggle__count">{allComments.length}</span>
      </button>

      {/* Backdrop (mobile) */}
      {open && <div className="comments-backdrop" onClick={() => setOpen(false)} />}

      {/* Panel */}
      <div ref={panelRef} className={`comments-panel${open ? ' comments-panel--open' : ''}`}>
        <div className="comments-panel__header">
          <h3 className="comments-panel__title">{t('comments.title')}</h3>
          <span className="comments-panel__count">{allComments.length}</span>
          <button className="comments-panel__close" onClick={() => setOpen(false)} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drag handle (mobile) */}
        <div className="comments-panel__handle" />

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
      </div>
    </>
  );
}
