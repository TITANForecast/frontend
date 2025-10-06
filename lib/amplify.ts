import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      loginWith: {
        email: true,
      },
    },
  },
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;
