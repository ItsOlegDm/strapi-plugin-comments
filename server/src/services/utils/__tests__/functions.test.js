const PluginError = require('../../../utils/error');
const {
  getRelatedGroups,
  filterOurResolvedReports,
  buildAuthorModel,
  buildPublicUserAuthor,
  getAuthorName,
  resolveUserContextError,
} = require('../functions');

const getMockStrapi = (attributes = {}) => ({
  contentType: jest.fn().mockReturnValue({ attributes }),
});

describe('Test service functions utils', () => {
  describe('getRelatedGroups', () => {
    test('splits and filters related uids', () => {
      const result = getRelatedGroups('api::article.article:1');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('filterOurResolvedReports', () => {
    test('returns falsy item when item is falsy', () => {
      expect(filterOurResolvedReports(null)).toBe(null);
      expect(filterOurResolvedReports(undefined)).toBe(undefined);
    });

    test('filters out resolved reports when item has reports', () => {
      const item = {
        id: 1,
        content: 'test',
        reports: [
          { id: 1, resolved: true },
          { id: 2, resolved: false },
        ],
      };
      const result = filterOurResolvedReports(item);
      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].resolved).toBe(false);
    });
  });

  describe('buildPublicUserAuthor', () => {
    test('returns all public user fields and excludes private schema attributes', () => {
      const strapi = getMockStrapi({
        password: { type: 'password', private: true },
        resetPasswordToken: { type: 'string', private: true },
        username: { type: 'string' },
        email: { type: 'email' },
        bio: { type: 'text' },
      });

      const result = buildPublicUserAuthor(
        {
          id: 10,
          username: 'john',
          email: 'john@test.com',
          bio: 'Hello world',
          password: 'secret',
          resetPasswordToken: 'token',
        },
        strapi,
      );

      expect(result).toMatchObject({
        id: 10,
        username: 'john',
        email: 'john@test.com',
        bio: 'Hello world',
        name: 'john',
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('resetPasswordToken');
    });

    test('applies blocked author props on top of private fields', () => {
      const strapi = getMockStrapi({
        username: { type: 'string' },
        email: { type: 'email' },
      });

      const result = buildPublicUserAuthor(
        {
          id: 10,
          username: 'john',
          email: 'john@test.com',
        },
        strapi,
        ['email'],
      );

      expect(result).toMatchObject({ id: 10, username: 'john', name: 'john' });
      expect(result).not.toHaveProperty('email');
    });
  });

  describe('buildAuthorModel', () => {
    test('returns full public user object for Strapi authors', () => {
      const strapi = getMockStrapi({
        username: { type: 'string' },
        email: { type: 'email' },
        password: { type: 'password', private: true },
      });
      const item = {
        id: 1,
        authorUser: {
          id: 10,
          username: 'john',
          email: 'john@test.com',
          password: 'secret',
          avatar: {
            url: '/uploads/large.png',
            formats: {
              thumbnail: { url: '/uploads/thumbnail.png' },
            },
          },
        },
        content: 'test',
      };
      const result = buildAuthorModel(item, [], strapi);
      expect(result.author).toMatchObject({
        id: 10,
        username: 'john',
        email: 'john@test.com',
        name: 'john',
        avatar: {
          url: '/uploads/large.png',
          formats: {
            thumbnail: { url: '/uploads/thumbnail.png' },
          },
        },
      });
      expect(result.author).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('authorUser');
    });

    test('filters blocked author props for generic authors', () => {
      const strapi = getMockStrapi({});
      const item = {
        id: 1,
        authorId: 10,
        authorName: 'john',
        authorEmail: 'john@test.com',
        authorAvatar: null,
        content: 'test',
      };
      const result = buildAuthorModel(item, ['email'], strapi);
      expect(result.author).not.toHaveProperty('email');
      expect(result.author).toMatchObject({ id: 10, name: 'john' });
    });
  });

  describe('getAuthorName', () => {
    test('returns firstname and lastname when both present', () => {
      expect(getAuthorName({ firstname: 'John', lastname: 'Doe' })).toBe('John Doe');
    });

    test('returns username when lastname and firstname are missing', () => {
      expect(getAuthorName({ username: 'johndoe' })).toBe('johndoe');
    });

    test('returns firstname when username is missing', () => {
      expect(getAuthorName({ firstname: 'John' })).toBe('John');
    });

    test('returns empty string when all fields are falsy', () => {
      expect(getAuthorName({})).toBe('');
    });
  });

  describe('Resolve user context error', () => {
    test('Should throw 401', () => {
      try {
        resolveUserContextError({ id: 1 });
      } catch (e) {
        expect(e).toBeInstanceOf(PluginError.default);
        expect(e).toHaveProperty('status', 401);
      }
    });

    test('Should throw 403', () => {
      try {
        resolveUserContextError();
      } catch (e) {
        expect(e).toBeInstanceOf(PluginError.default);
        expect(e).toHaveProperty('status', 403);
      }
    });
  });
});
