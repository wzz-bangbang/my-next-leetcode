import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** 登录方式：credentials/code/github/google */
      loginType?: string;
      /** 是否已设置密码 */
      hasPassword?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: number;
    loginType?: string;
    hasPassword?: boolean;
  }
}
