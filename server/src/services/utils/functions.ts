import { StrapiUser } from '@sensinum/strapi-utils';
import { isEmpty } from 'lodash';
import { AdminUser, CommentAuthor, CoreStrapi, Id } from '../../@types';
import { getUserPrivateFields } from '../../repositories/utils';
import { REGEX } from '../../utils/constants';
import PluginError from '../../utils/error';
import { Comment, CommentWithRelated } from '../../validators/repositories';

export const getRelatedGroups = (related: string): Array<string> =>
  related.split(REGEX.relatedUid).filter((s) => s && s.length > 0);

export const filterOurResolvedReports = (item: Comment): Comment =>
  item
    ? {
      ...item,
      reports: (item.reports || []).filter((report) => !report.resolved),
    }
    : item;

export const buildPublicUserAuthor = (
  user: Record<string, unknown>,
  strapi: CoreStrapi,
  blockedAuthorProps: string[] = [],
): CommentAuthor => {
  const excludedFields = new Set([
    ...getUserPrivateFields(strapi),
    ...blockedAuthorProps,
  ]);

  const publicUser = Object.fromEntries(
    Object.entries(user).filter(([key]) => !excludedFields.has(key)),
  ) as Record<string, unknown>;

  const name = getAuthorName({
    firstname: publicUser.firstname as string | undefined,
    lastname: publicUser.lastname as string | undefined,
    username: publicUser.username as string | undefined,
  });

  return {
    ...publicUser,
    ...(name ? { name } : {}),
  } as CommentAuthor;
};

export const buildAuthorModel = (
  item: Comment | CommentWithRelated,
  blockedAuthorProps: Array<string>,
  strapi: CoreStrapi,
): Comment => {
  const {
    authorUser,
    authorId,
    authorName,
    authorEmail,
    authorAvatar,
    ...rest
  } = item;
  let author: CommentAuthor = {} as CommentAuthor;

  if (authorUser && typeof authorUser !== 'string') {
    author = buildPublicUserAuthor(
      authorUser as Record<string, unknown>,
      strapi,
      blockedAuthorProps,
    );
  } else if (authorId) {
    author = {
      id: authorId,
      name: authorName,
      email: authorEmail,
      avatar: authorAvatar,
    };

    author = isEmpty(author)
      ? author
      : (Object.fromEntries(
        Object.entries(author).filter(([name]) => !blockedAuthorProps.includes(name)),
      ) as CommentAuthor);
  }

  return {
    ...rest,
    author: isEmpty(author) ? (item.author || {}) : author,
  } as Comment;
};

export const resolveUserContextError = (user?: AdminUser | StrapiUser): PluginError => {
  if (user) {
    throw new PluginError(401, 'Not authenticated');
  } else {
    throw new PluginError(403, 'Not authorized');
  }
};

type AuthorNameProps = {
  lastname?: string;
  firstname?: string;
  username?: string;
};

export const getAuthorName = (author: AuthorNameProps): string => {
  const { lastname, username, firstname } = author;

  if (lastname && firstname) {
    return `${firstname} ${lastname}`;
  }
  return username || firstname || '';
};
