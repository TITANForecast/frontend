import { Amplify } from 'aws-amplify';

// Runtime configuration function
export function configureAmplify() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error('Auth UserPool not configured. Missing NEXT_PUBLIC_COGNITO_USER_POOL_ID or NEXT_PUBLIC_COGNITO_CLIENT_ID environment variables.');
  }

  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
        loginWith: {
          email: true,
        },
      },
    },
  };

  Amplify.configure(amplifyConfig);
  return amplifyConfig;
}

// Auto-configure on module load if environment variables are available
if (typeof window !== 'undefined') {
  // Only configure on client side
  try {
    configureAmplify();
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}
