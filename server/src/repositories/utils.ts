import { CoreStrapi } from '../@types';
import { ContentTypesUUIDs, KeysContentTypes } from '../content-types';

export const STRAPI_USER_UID = 'plugin::users-permissions.user';

const POPULATABLE_USER_ATTRIBUTE_TYPES = ['media', 'relation', 'component', 'dynamiczone'] as const;

export const getModelUid = (strapi: CoreStrapi, name: KeysContentTypes): ContentTypesUUIDs => {
  return strapi.plugin('comments').contentType(name)?.uid;
};

export const getUserPrivateFields = (strapi: CoreStrapi): string[] => {
  const { attributes = {} } = strapi.contentType(STRAPI_USER_UID) ?? {};

  return Object.entries(attributes)
    .filter(([, attribute]) => attribute?.private === true)
    .map(([key]) => key);
};

export const getDefaultAuthorPopulate = (strapi: CoreStrapi) => {
  const { attributes = {} } = strapi.contentType(STRAPI_USER_UID) ?? {};
  const populate = Object.entries(attributes).reduce<Record<string, boolean>>(
    (acc, [key, attribute]) => {
      if (POPULATABLE_USER_ATTRIBUTE_TYPES.includes(attribute?.type)) {
        acc[key] = true;
      }
      return acc;
    },
    {},
  );

  if (Object.keys(populate).length > 0) {
    return { populate };
  }

  return true;
};

export function getOrderBy(orderBy?: string | null) {
  return typeof orderBy === 'string' ? orderBy.split(':') : 'createdAt:desc'.split(':');
}
