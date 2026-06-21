import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer } from "firebase/firestore";

// Config values matching firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBM5PS4SVFNsSdHFr1hJgcNRrrMaFlx0UQ",
  authDomain: "eng-lambda-n6ppv.firebaseapp.com",
  projectId: "eng-lambda-n6ppv",
  storageBucket: "eng-lambda-n6ppv.firebasestorage.app",
  messagingSenderId: "9704863029",
  appId: "1:9704863029:web:4e99ca524ad5d2ba6d487c"
};

// Initialize Firebase application
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize custom-named Firestore instance
export const db = initializeFirestore(app, {}, "ai-studio-bae4df66-18fa-4482-8d6d-b21ec5e49560");

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Standard firestore error handling per Firebase Skill instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
