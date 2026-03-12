// MOCK FIREBASE - System is now standalone
export const db = {} as any;
export const auth = {
  currentUser: null,
  signOut: () => Promise.resolve(),
} as any;
export const googleProvider = {} as any;

export const loginWithGoogle = () => Promise.reject("Google login is disabled.");
export const logout = () => Promise.resolve();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Local Storage Error: ', error);
}
