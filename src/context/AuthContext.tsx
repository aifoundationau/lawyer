import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { LegalProfessional } from '../types';
import { lawyerSelectStore } from '../services/lawyerSelectStore';

export type UserRole = 'client' | 'lawyer' | 'guest' | 'superadmin';

export const FIREBASE_ADMIN_EMAIL = 'firebase-adminsdk-fbsvc@ai-foundation-firebase.iam.gserviceaccount.com';

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return (
    e === FIREBASE_ADMIN_EMAIL.toLowerCase() ||
    e === 'admin@lawyerselect.com.au' ||
    e === 'superadmin@lawyerselect.com.au' ||
    e === 'support@aifoundation.net.au' ||
    e.startsWith('admin@') ||
    e.startsWith('superadmin@')
  );
};

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  lawyerProfileId?: string;
  photoURL?: string;
  isSuperAdmin?: boolean;
}

export interface AuthContextType {
  currentUser: UserAccount | null;
  role: UserRole;
  isAuthenticated: boolean;
  signInAsDemoClient: (name?: string, email?: string) => void;
  signInAsDemoLawyer: (lawyerId?: string) => void;
  signInWithGoogle: () => Promise<void>;
  signUpCustom: (name: string, email: string, role: UserRole, phone?: string) => void;
  signOut: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const STORAGE_KEY_AUTH = 'lawyerselect_current_user_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  }, [currentUser]);

  // Listen to Firebase Auth state and maintain an authenticated session for security rules
  useEffect(() => {
    if (!auth) return;
    try {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: any) => {
        if (fbUser && !fbUser.isAnonymous) {
          const isAdmin = isSuperAdminEmail(fbUser.email);
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || (isAdmin ? 'SuperAdmin' : 'User'),
            role: isAdmin ? 'superadmin' : 'client',
            photoURL: fbUser.photoURL || undefined,
            isSuperAdmin: isAdmin,
          });
        } else if (!fbUser) {
          // Provision an anonymous session for background rules access without logging the user in as a named persona
          signInAnonymously(auth).catch(() => {
            // offline or emulator fallback
          });
        }
      });
      return () => unsubscribe();
    } catch {
      // offline safe
    }
  }, []);

  const signInAsDemoClient = (name = 'David K.', email = 'david.k@enterprise-nsw.com.au') => {
    const isAdmin = isSuperAdminEmail(email);
    const clientUser: UserAccount = {
      uid: 'client_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
      email,
      displayName: name,
      role: isAdmin ? 'superadmin' : 'client',
      phone: '+61 412 990 123',
      isSuperAdmin: isAdmin,
    };
    setCurrentUser(clientUser);
    setShowAuthModal(false);
  };

  const signInAsDemoLawyer = (lawyerId = 'lp_elena_vance') => {
    const pro = lawyerSelectStore.getProfessionals().find((p) => p.id === lawyerId) || lawyerSelectStore.getProfessionals()[0];
    const lawyerUser: UserAccount = {
      uid: pro ? pro.id : 'lp_elena_vance',
      email: pro ? pro.email : 'elena.vance@wentworthchambers.com.au',
      displayName: pro ? pro.fullName : 'Elena Vance SC',
      role: 'lawyer',
      phone: pro ? pro.phone : '+61 2 9230 8800',
      lawyerProfileId: pro ? pro.id : 'lp_elena_vance',
      isSuperAdmin: isSuperAdminEmail(pro?.email),
    };
    setCurrentUser(lawyerUser);
    setShowAuthModal(false);
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        const u = result.user;
        const isAdmin = isSuperAdminEmail(u.email);
        const account: UserAccount = {
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || (isAdmin ? 'SuperAdmin' : 'User'),
          role: isAdmin ? 'superadmin' : 'client',
          photoURL: u.photoURL || undefined,
          isSuperAdmin: isAdmin,
        };
        setCurrentUser(account);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err.message);
    }
  };
      signInAsDemoClient('Google Verified Client', 'client.verified@gmail.com');
    }
  };

  const signUpCustom = (name: string, email: string, role: UserRole, phone?: string) => {
    const newUser: UserAccount = {
      uid: (role === 'lawyer' ? 'lp_' : 'client_') + Math.random().toString(36).substring(2, 9),
      email: email.trim(),
      displayName: name.trim(),
      role,
      phone: phone?.trim(),
      lawyerProfileId: role === 'lawyer' ? 'lp_' + Math.random().toString(36).substring(2, 9) : undefined,
    };
    setCurrentUser(newUser);
    setShowAuthModal(false);
  };

  const signOut = () => {
    try {
      firebaseSignOut(auth).catch(() => {});
    } catch {}
    setCurrentUser(null);
  };

  const role: UserRole = currentUser ? currentUser.role : 'guest';
  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        signInAsDemoClient,
        signInAsDemoLawyer,
        signInWithGoogle,
        signUpCustom,
        signOut,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
