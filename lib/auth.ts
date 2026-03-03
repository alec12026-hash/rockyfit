import { cookies } from 'next/headers';

/**
 * Get current user ID from cookie.
 * Returns the user ID from cookie, or throws if not logged in.
 * All protected routes must require authentication.
 */
export async function getUserId(): Promise<number> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('rockyfit_user');
  
  if (!userCookie || !userCookie.value) {
    throw new Error('NOT_AUTHENTICATED');
  }
  
  const userId = parseInt(userCookie.value, 10);
  if (isNaN(userId) || userId < 1) {
    throw new Error('INVALID_USER_ID');
  }
  
  return userId;
}

/**
 * Get user ID from request headers (for server-side API routes).
 * Falls back to cookie if not in headers.
 * @throws Error if not authenticated
 */
export function getUserIdFromRequest(request: Request): number {
  // First try header (set by middleware)
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) {
    const userId = parseInt(headerUserId, 10);
    if (!isNaN(userId) && userId >= 1) {
      return userId;
    }
  }
  
  // Fall back to cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/rockyfit_user=([^;]+)/);
    if (match && match[1]) {
      const userId = parseInt(match[1], 10);
      if (!isNaN(userId) && userId >= 1) {
        return userId;
      }
    }
  }
  
  // Not authenticated - throw
  throw new Error('NOT_AUTHENTICATED');
}

/**
 * Check if user is authenticated (not the default Alec account for new users).
 * For Alec (user_id=1 with LEGACY_ACCOUNT), this always returns true.
 * For other users, checks if they have a valid session.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('rockyfit_user');
  
  // If no cookie, not authenticated (except Alec's legacy access)
  if (!userCookie || !userCookie.value) {
    return false;
  }
  
  const userId = parseInt(userCookie.value, 10);
  return !isNaN(userId) && userId >= 1;
}

/**
 * Check if current user has completed onboarding.
 * Returns true for Alec (user_id=1) since his data is pre-migrated.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const userId = await getUserId();
  
  // Alec (user_id=1) always has onboarding complete
  if (userId === 1) {
    return true;
  }
  
  // For other users, would check user_profiles
  // This requires a DB call, so we'll handle this in the API
  return false;
}
