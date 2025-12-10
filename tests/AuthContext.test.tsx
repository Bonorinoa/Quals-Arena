import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth, AuthErrorType } from '../services/AuthContext';
import { User } from 'firebase/auth';

// Mock Firebase
vi.mock('../services/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

// Mock Firebase auth functions
const mockOnAuthStateChanged = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no user, successful auth state listener
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn(); // unsubscribe function
    });
  });

  describe('AuthProvider', () => {
    it('should provide initial loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(false); // Will be false after initial callback
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should update user when auth state changes', async () => {
      const mockUser = {
        uid: 'test-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      } as User;

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUser);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle sign in successfully', async () => {
      const mockUser = {
        uid: 'test-123',
        email: 'test@example.com',
      } as User;

      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should handle popup blocked error', async () => {
      const error = new Error('Popup blocked');
      (error as any).code = 'auth/popup-blocked';
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        try {
          await result.current.signIn();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toContain('popup');
      expect(result.current.errorType).toBe(AuthErrorType.POPUP_BLOCKED);
    });

    it('should handle popup closed by user', async () => {
      const error = new Error('Popup closed');
      (error as any).code = 'auth/popup-closed-by-user';
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        try {
          await result.current.signIn();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toContain('cancelled');
      expect(result.current.errorType).toBe(AuthErrorType.POPUP_CLOSED);
    });

    it('should handle network error', async () => {
      const error = new Error('Network failed');
      (error as any).code = 'auth/network-request-failed';
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        try {
          await result.current.signIn();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toContain('Network');
      expect(result.current.errorType).toBe(AuthErrorType.NETWORK_ERROR);
    });

    it('should handle unauthorized domain error', async () => {
      const error = new Error('Unauthorized domain');
      (error as any).code = 'auth/unauthorized-domain';
      mockSignInWithPopup.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        try {
          await result.current.signIn();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toContain('not authorized');
      expect(result.current.errorType).toBe(AuthErrorType.UNKNOWN_ERROR);
    });

    it('should clear error on successful sign in', async () => {
      // First fail, then succeed
      const error = new Error('Network failed');
      (error as any).code = 'auth/network-request-failed';
      mockSignInWithPopup.mockRejectedValueOnce(error);
      mockSignInWithPopup.mockResolvedValueOnce({ user: {} });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // First attempt fails
      await act(async () => {
        try {
          await result.current.signIn();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      // Second attempt succeeds
      await act(async () => {
        await result.current.signIn();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle sign out successfully', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should handle sign out error', async () => {
      const error = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toContain('Sign out failed');
    });

    it('should handle auth state change errors', async () => {
      const error = new Error('Auth state error');
      (error as any).code = 'auth/network-request-failed';
      
      mockOnAuthStateChanged.mockImplementation((auth, successCallback, errorCallback) => {
        errorCallback(error);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.errorType).toBe(AuthErrorType.NETWORK_ERROR);
      });
    });

    it('should unsubscribe from auth state on unmount', () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChanged.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
