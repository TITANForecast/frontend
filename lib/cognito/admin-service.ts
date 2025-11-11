import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminResetUserPasswordCommand,
  MessageActionType,
} from "@aws-sdk/client-cognito-identity-provider";

// Initialize Cognito client (server-side only)
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
  // Uses IAM role credentials when running in ECS
  // Uses AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY for local development
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;

/**
 * Create a new user in Cognito with a permanent password (no email invitation)
 */
export async function createCognitoUser(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; cognitoSub?: string; error?: string }> {
  try {
    // Step 1: Create the user with MessageAction.SUPPRESS to prevent email
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email, // Use email as username
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "email_verified", Value: "true" }, // Auto-verify email
      ],
      MessageAction: MessageActionType.SUPPRESS, // Don't send invitation email
    });

    const response = await cognitoClient.send(createCommand);

    // Extract Cognito Sub from response
    const cognitoSub = response.User?.Attributes?.find(
      (attr) => attr.Name === "sub"
    )?.Value;

    if (!cognitoSub) {
      return { success: false, error: "Failed to extract Cognito sub" };
    }

    // Step 2: Set a permanent password (no password reset required)
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true, // Set as permanent password
    });

    await cognitoClient.send(setPasswordCommand);

    return { success: true, cognitoSub };
  } catch (error: any) {
    console.error("Error creating Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user attributes in Cognito
 */
export async function updateCognitoUser(
  email: string,
  attributes: { name?: string; email_verified?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const userAttributes = [];
    
    if (attributes.name) {
      userAttributes.push({ Name: "name", Value: attributes.name });
    }
    if (attributes.email_verified) {
      userAttributes.push({ Name: "email_verified", Value: attributes.email_verified });
    }

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: userAttributes,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Set a permanent password for an existing Cognito user
 */
export async function setCognitoUserPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true, // Set as permanent password (no reset required)
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error setting Cognito user password:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Disable user in Cognito (soft delete - user cannot login)
 */
export async function disableCognitoUser(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminDisableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error disabling Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Enable user in Cognito
 */
export async function enableCognitoUser(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminEnableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error enabling Cognito user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete user from Cognito (hard delete - cannot be undone)
 */
export async function deleteCognitoUser(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting Cognito user:", error);
    
    // User might not exist in Cognito - don't fail the operation
    if (error.name === "UserNotFoundException") {
      console.warn(`User ${email} not found in Cognito, skipping deletion`);
      return { success: true };
    }
    
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email to user
 */
export async function resetCognitoUserPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new AdminResetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user exists in Cognito and get their details
 */
export async function checkCognitoUserExists(
  email: string
): Promise<{ 
  exists: boolean; 
  user?: {
    cognitoSub: string;
    email: string;
    name?: string;
    status: string; // CONFIRMED, FORCE_CHANGE_PASSWORD, etc.
    enabled: boolean;
    created: Date;
  };
  error?: string;
}> {
  try {
    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
    });

    const response = await cognitoClient.send(command);
    
    // Extract user attributes
    const attributes = response.UserAttributes || [];
    const cognitoSub = attributes.find(attr => attr.Name === "sub")?.Value;
    const emailAttr = attributes.find(attr => attr.Name === "email")?.Value;
    const nameAttr = attributes.find(attr => attr.Name === "name")?.Value;
    
    if (!cognitoSub) {
      return { exists: false, error: "User found but missing sub attribute" };
    }

    return { 
      exists: true,
      user: {
        cognitoSub,
        email: emailAttr || email,
        name: nameAttr,
        status: response.UserStatus || "UNKNOWN",
        enabled: response.Enabled || false,
        created: response.UserCreateDate || new Date(),
      }
    };
  } catch (error: any) {
    if (error.name === "UserNotFoundException") {
      return { exists: false };
    }
    console.error("Error checking Cognito user:", error);
    return { exists: false, error: error.message };
  }
}

