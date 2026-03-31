export const cognitoConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION ?? '',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? '',
  userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '',
  oauth: {
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '',
    redirectSignIn: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_IN ?? '',
    redirectSignOut: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_SIGN_OUT ?? '',
    responseType: 'code' as const,
  },
} as const;
