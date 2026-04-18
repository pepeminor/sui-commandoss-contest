'use client';

import { useState, type FormEvent } from 'react';
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

  const seededComments = getSeededComments(postId);
  const allComments = [...userComments, ...seededComments];

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
    <section className="comments">
      <div className="comments__header">
        <h3 className="comments__title">{t('comments.title')}</h3>
        <span className="comments__count">{allComments.length}</span>
      </div>

      <form className="comments__form" onSubmit={handleSubmit}>
        <input
          className="comments__input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={address ? t('comments.placeholder') : t('comments.loginToComment')}
          disabled={!address}
          maxLength={280}
        />
        <button
          className="comments__submit"
          type="submit"
          disabled={!address || !input.trim()}
        >
          {t('comments.send')}
        </button>
      </form>

      <ul className="comments__list">
        {allComments.map((comment) => {
          const isUser = comment.id.startsWith('user-');
          return (
            <li key={comment.id} className={`comments__item${isUser ? ' comments__item--user' : ''}`}>
              <AddressAvatar address={comment.address} size={28} className="comments__avatar" />
              <div className="comments__body">
                <span className="comments__author">{shortenAddress(comment.address)}</span>
                <p className="comments__text">{comment.text}</p>
              </div>
              <span className="comments__time">{comment.timeAgo}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
