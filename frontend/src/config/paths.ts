export const paths = {
  home: {
    getHref: () => '/',
  },

  auth: {
    register: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
    login: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`,
    },
  },

  app: {
    root: {
      getHref: () => '/app',
    },
    dashboard: {
      getHref: () => '/app',
    },
    discussions: {
      getHref: () => '/app/discussions',
    },
    discussion: {
      getHref: (id: string) => `/app/discussions/${id}`,
    },
    users: {
      getHref: () => '/app/users',
    },
    profile: {
      getHref: () => '/app/profile',
    },
  },
  owner: {
    login: {
      getHref: () => '/owner/login',
    },
    dashboard: {
      getHref: () => '/owner/dashboard',
    },
    rewards: {
      getHref: () => '/owner/rewards',
    },
    settings: {
      getHref: () => '/owner/settings',
    },
    customers: {
      getHref: () => '/owner/customers',
    },
    team: {
      getHref: () => '/owner/team',
    },
  },
  public: {
    discussion: {
      getHref: (id: string) => `/public/discussions/${id}`,
    },
  },
} as const;
