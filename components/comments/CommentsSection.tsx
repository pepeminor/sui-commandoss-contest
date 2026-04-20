'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressAvatar } from '@/components/AddressAvatar';
import { shortenAddress, timeAgo } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/auth/useAuth';
import { useComments, usePostComment } from '@/hooks/useComments';
import { commentSchema } from '@/lib/validation';

interface Props {
  postId: string;
}

export function CommentsSection({ postId }: Props) {
  const { t } = useI18n();
  const { address } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const form = useForm<{ content: string }>({
    resolver: zodResolver(commentSchema.pick({ content: true })),
    mode: 'onChange',
    defaultValues: { content: '' },
  });

  const { data: comments = [], isLoading } = useComments(postId);
  const { mutate: submitComment, isPending } = usePostComment(postId);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!mobileOpen) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSubmit = form.handleSubmit(({ content }) => {
    const text = content.trim();
    if (!text || !address || isPending) return;

    submitComment(
      { postId, address, content: text },
      { onSuccess: () => form.reset({ content: '' }) },
    );
  });

  const commentCount = comments.length;

  const panelContent = (
    <>
      <div className="comments-panel__header">
        <i className="ri-chat-3-line comments-panel__icon" style={{ fontSize: 16 }} />
        <h3 className="comments-panel__title">{t('comments.title')}</h3>
        <span className="comments-panel__count">{commentCount}</span>
        <button className="comments-panel__close comments-panel__close--mobile" onClick={() => setMobileOpen(false)} aria-label="Close">
          <i className="ri-close-line" style={{ fontSize: 16 }} />
        </button>
        <button className="comments-panel__close comments-panel__close--desktop" onClick={() => setDesktopOpen(false)} aria-label="Close">
          <i className="ri-close-line" style={{ fontSize: 16 }} />
        </button>
      </div>

      <ul className="comments-panel__list">
        {isLoading ? (
          <li className="comments-panel__loading">
            <div className="loading-skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
            <div className="loading-skeleton" style={{ height: 14, width: '50%' }} />
          </li>
        ) : comments.length === 0 ? (
          <li className="comments-panel__empty">{t('comments.empty')}</li>
        ) : (
          comments.map((comment) => {
            const isUser = comment.address === address;
            return (
              <li key={comment.id} className={`comments-panel__item${isUser ? ' comments-panel__item--user' : ''}`}>
                <AddressAvatar address={comment.address} size={28} className="comments-panel__avatar" />
                <div className="comments-panel__body">
                  <span className="comments-panel__author">{shortenAddress(comment.address)}</span>
                  <p className="comments-panel__text">{comment.content}</p>
                </div>
                <span className="comments-panel__time">{timeAgo(comment.created_at)}</span>
              </li>
            );
          })
        )}
      </ul>

      <form className="comments-panel__form" onSubmit={handleSubmit}>
        <input
          className="comments-panel__input"
          type="text"
          placeholder={address ? t('comments.placeholder') : t('comments.loginToComment')}
          disabled={!address || isPending}
          maxLength={500}
          {...form.register('content')}
        />
        <button
          className="comments-panel__submit"
          type="submit"
          disabled={!address || !form.formState.isValid || isPending}
        >
          {isPending ? (
            <div className="comments-panel__submit-spinner" />
          ) : (
            <i className="ri-send-plane-fill" style={{ fontSize: 16 }} />
          )}
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
          <i className="ri-chat-3-line" style={{ fontSize: 18 }} />
          <span className="comments-toggle__count">{commentCount}</span>
        </button>
      )}

      {/* Mobile: toggle button + bottom sheet */}
      <button
        className="comments-toggle comments-toggle--mobile"
        onClick={() => setMobileOpen(true)}
        aria-label={t('comments.title')}
      >
        <i className="ri-chat-3-line" style={{ fontSize: 18 }} />
        <span className="comments-toggle__count">{commentCount}</span>
      </button>

      {mobileOpen && <div className="comments-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className={`comments-panel comments-panel--mobile${mobileOpen ? ' comments-panel--open' : ''}`}>
        <div className="comments-panel__handle" />
        {panelContent}
      </div>
    </>
  );
}
