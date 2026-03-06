/**
 * Mock for Firebase modules (firebase/app, firebase/auth, firebase/firestore, firebase/storage).
 *
 * Usage in tests:
 *   vi.mock('firebase/app', () => import('@/test/mocks/firebase').then(m => m.firebaseAppMock));
 *   vi.mock('firebase/auth', () => import('@/test/mocks/firebase').then(m => m.firebaseAuthMock));
 *   vi.mock('@/lib/firebase', () => import('@/test/mocks/firebase').then(m => m.firebaseLibMock));
 */
import { vi } from 'vitest';

// ─── Mock User ──────────────────────────────────────────────────────────────

export const mockUser = {
  uid: 'test-uid-123',
  email: 'testuser@church.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2025-01-01T00:00:00Z',
    lastSignInTime: '2025-03-06T12:00:00Z',
  },
  providerData: [
    {
      providerId: 'google.com',
      uid: 'google-uid-456',
      displayName: 'Test User',
      email: 'testuser@church.com',
      photoURL: 'https://example.com/photo.jpg',
    },
  ],
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: vi.fn().mockResolvedValue({ token: 'mock-id-token', claims: {} }),
  reload: vi.fn().mockResolvedValue(undefined),
  toJSON: vi.fn().mockReturnValue({}),
  delete: vi.fn().mockResolvedValue(undefined),
};

// ─── Auth Mocks ─────────────────────────────────────────────────────────────

// onAuthStateChanged: calls callback immediately with mockUser (logged in) by default
export const mockOnAuthStateChanged = vi.fn().mockImplementation((_auth, callback) => {
  // Simulate async auth state resolution
  setTimeout(() => callback(mockUser), 0);
  // Return unsubscribe function
  return vi.fn();
});

export const mockSignInWithPopup = vi.fn().mockResolvedValue({
  user: mockUser,
  providerId: 'google.com',
  operationType: 'signIn',
});

export const mockSignOut = vi.fn().mockResolvedValue(undefined);

export const mockGetAuth = vi.fn().mockReturnValue({
  currentUser: mockUser,
  onAuthStateChanged: mockOnAuthStateChanged,
});

export const MockGoogleAuthProvider = vi.fn(function (this: { providerId: string }) {
  this.providerId = 'google.com';
});

// ─── App Mocks ──────────────────────────────────────────────────────────────

const mockApp = { name: '[DEFAULT]', options: {}, automaticDataCollectionEnabled: false };
export const mockInitializeApp = vi.fn().mockReturnValue(mockApp);
export const mockGetApp = vi.fn().mockReturnValue(mockApp);

// ─── Firestore / Storage stubs ──────────────────────────────────────────────

export const mockGetFirestore = vi.fn().mockReturnValue({});
export const mockGetStorage = vi.fn().mockReturnValue({});

// ─── Module-level mocks (for vi.mock) ───────────────────────────────────────

/** vi.mock('firebase/app', () => firebaseAppMock) */
export const firebaseAppMock = {
  initializeApp: mockInitializeApp,
  getApp: mockGetApp,
};

/** vi.mock('firebase/auth', () => firebaseAuthMock) */
export const firebaseAuthMock = {
  getAuth: mockGetAuth,
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  GoogleAuthProvider: MockGoogleAuthProvider,
};

/** vi.mock('@/lib/firebase', () => firebaseLibMock) — mocks the project's firebase.ts re-exports */
export const firebaseLibMock = {
  auth: mockGetAuth(),
  db: mockGetFirestore(),
  storage: mockGetStorage(),
};
