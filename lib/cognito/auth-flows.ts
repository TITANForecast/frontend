/**
 * Cognito Authentication Flows
 * 
 * Handles password reset and email verification flows using AWS Amplify
 */

import { 
  resetPassword, 
  confirmResetPassword,
  resendSignUpCode,
  confirmSignUp,
  type ResetPasswordOutput,
  type ConfirmResetPasswordInput
} from 'aws-amplify/auth';

/**
 * Initiate password reset flow
 * Sends verification code to user's email
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  destination?: string;
  error?: string;
}> {
  try {
    const output: ResetPasswordOutput = await resetPassword({ username: email });
    
    const { nextStep } = output;
    
    if (nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
      return {
        success: true,
        destination: nextStep.codeDeliveryDetails.destination,
      };
    }
    
    return {
      success: false,
      error: 'Unexpected reset password flow',
    };
  } catch (error: any) {
    console.error('Password reset request failed:', error);
    
    // User-friendly error messages
    if (error.name === 'UserNotFoundException') {
      return {
        success: false,
        error: 'No account found with this email address',
      };
    }
    
    if (error.name === 'LimitExceededException') {
      return {
        success: false,
        error: 'Too many attempts. Please try again later',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send reset code',
    };
  }
}

/**
 * Complete password reset with verification code
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Password reset confirmation failed:', error);
    
    // User-friendly error messages
    if (error.name === 'CodeMismatchException') {
      return {
        success: false,
        error: 'Invalid verification code. Please try again',
      };
    }
    
    if (error.name === 'ExpiredCodeException') {
      return {
        success: false,
        error: 'Verification code has expired. Please request a new one',
      };
    }
    
    if (error.name === 'InvalidPasswordException') {
      return {
        success: false,
        error: 'Password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, number, and special character',
      };
    }
    
    if (error.name === 'LimitExceededException') {
      return {
        success: false,
        error: 'Too many attempts. Please try again later',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to reset password',
    };
  }
}

/**
 * Resend email verification code
 */
export async function resendVerificationCode(email: string): Promise<{
  success: boolean;
  destination?: string;
  error?: string;
}> {
  try {
    const output = await resendSignUpCode({ username: email });
    
    return {
      success: true,
      destination: output.destination,
    };
  } catch (error: any) {
    console.error('Resend verification code failed:', error);
    
    if (error.name === 'UserNotFoundException') {
      return {
        success: false,
        error: 'No account found with this email address',
      };
    }
    
    if (error.name === 'LimitExceededException') {
      return {
        success: false,
        error: 'Too many attempts. Please try again later',
      };
    }
    
    if (error.name === 'InvalidParameterException') {
      return {
        success: false,
        error: 'Account already verified',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to resend verification code',
    };
  }
}

/**
 * Confirm email verification with code
 */
export async function verifyEmail(
  email: string,
  code: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Email verification failed:', error);
    
    if (error.name === 'CodeMismatchException') {
      return {
        success: false,
        error: 'Invalid verification code. Please try again',
      };
    }
    
    if (error.name === 'ExpiredCodeException') {
      return {
        success: false,
        error: 'Verification code has expired. Please request a new one',
      };
    }
    
    if (error.name === 'NotAuthorizedException') {
      return {
        success: false,
        error: 'Account already verified or does not exist',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Failed to verify email',
    };
  }
}

/**
 * Validate password meets Cognito requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain a number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Must contain special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

