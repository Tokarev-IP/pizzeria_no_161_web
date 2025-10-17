import { 
  signInAnonymously, 
  signInWithPhoneNumber, 
  PhoneAuthProvider, 
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from './FirebaseConfig';

export interface AuthUser {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  isAnonymous: boolean;
  emailVerified: boolean;
  photoURL?: string;
}

export interface PhoneAuthState {
  verificationId: string | null;
  confirmationResult: ConfirmationResult | null;
  isVerificationSent: boolean;
  error: string | null;
}

let phoneAuthState: PhoneAuthState = {
  verificationId: null,
  confirmationResult: null,
  isVerificationSent: false,
  error: null
};

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize reCAPTCHA verifier for phone authentication
 * @param containerId - HTML element ID where reCAPTCHA will be rendered
 */
export const initializeRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  // Reuse existing verifier if already initialized for this session
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    }
  });

  // Ensure widget is rendered immediately to avoid deferred rendering hangs
  try {
    // render() returns a widgetId; awaiting ensures DOM is ready
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    recaptchaVerifier.render();
  } catch (e) {
    console.warn('reCAPTCHA render failed (will retry on use):', e);
  }

  return recaptchaVerifier;
};

/**
 * Sign in anonymously
 * @returns Promise<AuthUser> - The authenticated user
 */
export const signInAnonymous = async (): Promise<AuthUser> => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    return {
      uid: user.uid,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      displayName: user.displayName || undefined,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || undefined
    };
  } catch (error: any) {
    console.error('Anonymous sign-in error:', error);
    throw new Error(`Anonymous sign-in failed: ${error.message}`);
  }
};

/**
 * Send OTP to phone number
 * @param phoneNumber - Phone number in international format (e.g., +1234567890)
 * @param recaptchaContainerId - Optional container ID for reCAPTCHA
 * @returns Promise<string> - Verification ID
 */
export const sendPhoneOTP = async (
  phoneNumber: string, 
  recaptchaContainerId?: string
): Promise<string> => {
  try {
    // Ensure reCAPTCHA is initialized and rendered
    if (!recaptchaVerifier) {
      initializeRecaptcha(recaptchaContainerId || 'recaptcha-container');
    }
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier initialization failed');
    }

    try {
      await recaptchaVerifier.render();
    } catch {}

    // Add an explicit timeout to prevent infinite pending state
    const TIMEOUT_MS = 30000; // 30s
    const confirmationResult = await Promise.race<ConfirmationResult>([
      signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Тайм-аут при отправке кода (30с)')), TIMEOUT_MS))
    ]) as ConfirmationResult;
    
    // Update state
    phoneAuthState = {
      verificationId: confirmationResult.verificationId,
      confirmationResult,
      isVerificationSent: true,
      error: null
    };

    return confirmationResult.verificationId;
  } catch (error: any) {
    console.error('Send OTP error:', error);
    phoneAuthState.error = error.message;
    // Normalize common Firebase/App Check errors for clearer UX
    const message = (error?.code === 'auth/too-many-requests')
      ? 'Слишком много попыток. Попробуйте позже.'
      : (error?.code === 'app-check/token-error' || /app check/i.test(error?.message || ''))
        ? 'Проблема с App Check/recaptcha. Обновите страницу или попробуйте позже.'
        : error.message;
    throw new Error(`Failed to send OTP: ${message}`);
  }
};

/**
 * Verify OTP and sign in with phone number
 * @param otp - The OTP code received via SMS
 * @returns Promise<AuthUser> - The authenticated user
 */
export const verifyPhoneOTP = async (otp: string): Promise<AuthUser> => {
  try {
    if (!phoneAuthState.confirmationResult) {
      throw new Error('No verification in progress. Please send OTP first.');
    }

    const result = await phoneAuthState.confirmationResult.confirm(otp);
    const user = result.user;

    // Reset phone auth state
    phoneAuthState = {
      verificationId: null,
      confirmationResult: null,
      isVerificationSent: false,
      error: null
    };

    // Clear reCAPTCHA
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }

    return {
      uid: user.uid,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      displayName: user.displayName || undefined,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || undefined
    };
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    // Normalize common error codes to user-friendly Russian messages
    const code = error?.code as string | undefined;
    if (code === 'auth/invalid-verification-code') {
      throw new Error('Код неверный');
    }
    throw new Error(`OTP verification failed: ${error.message}`);
  }
};

/**
 * Get current authenticated user
 * @returns AuthUser | null - Current user or null if not authenticated
 */
export const getCurrentUser = (): AuthUser | null => {
  const user = auth.currentUser;
  
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email || undefined,
    phoneNumber: user.phoneNumber || undefined,
    displayName: user.displayName || undefined,
    isAnonymous: user.isAnonymous,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL || undefined
  };
};

/**
 * Get current user asynchronously (waits for auth state to be determined)
 * @returns Promise<AuthUser | null> - Current user or null if not authenticated
 */
export const getCurrentUserAsync = (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      
      if (!user) {
        resolve(null);
        return;
      }

      resolve({
        uid: user.uid,
        email: user.email || undefined,
        phoneNumber: user.phoneNumber || undefined,
        displayName: user.displayName || undefined,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL || undefined
      });
    });
  });
};

/**
 * Sign out current user
 * @returns Promise<void>
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    
    // Reset phone auth state
    phoneAuthState = {
      verificationId: null,
      confirmationResult: null,
      isVerificationSent: false,
      error: null
    };

    // Clear reCAPTCHA
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(`Sign out failed: ${error.message}`);
  }
};

/**
 * Listen to authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Function to unsubscribe from the listener
 */
export const onAuthStateChange = (callback: (user: AuthUser | null) => void): (() => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      callback(null);
      return;
    }

    callback({
      uid: user.uid,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      displayName: user.displayName || undefined,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL || undefined
    });
  });
};

/**
 * Get current phone authentication state
 * @returns PhoneAuthState - Current phone auth state
 */
export const getPhoneAuthState = (): PhoneAuthState => {
  return { ...phoneAuthState };
};

/**
 * Clear phone authentication state
 */
export const clearPhoneAuthState = (): void => {
  phoneAuthState = {
    verificationId: null,
    confirmationResult: null,
    isVerificationSent: false,
    error: null
  };

  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

// Export the auth instance for direct use if needed
export { auth };
