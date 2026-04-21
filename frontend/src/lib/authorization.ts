import { Comment, User } from '@/types/api';

export const canCreateDiscussion = (user: User | null | undefined) => {
  return user?.role?.name === 'admin';
};
export const canDeleteDiscussion = (user: User | null | undefined) => {
  return user?.role?.name === 'admin';
};
export const canUpdateDiscussion = (user: User | null | undefined) => {
  return user?.role?.name === 'admin';
};

export const canViewUsers = (user: User | null | undefined) => {
  return user?.role?.name === 'admin';
};

export const canDeleteComment = (
  user: User | null | undefined,
  comment: Comment,
) => {
  if (user?.role === 'ADMIN') {
    return true;
  }

  if (user?.role?.name === 'user' && comment.author?.id === user.id) {
    return true;
  }

  return false;
};
