declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'production' | 'test';
    NEXT_PUBLIC_API_URL?: string;
    DATABASE_URL?: string;
    RESEND_API_KEY?: string;
  }
}

export {};
