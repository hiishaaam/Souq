/// <reference types="vite/client" />

declare module "*.json" {
  const value: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
    firestoreDatabaseId?: string;
  };
  export default value;
}
