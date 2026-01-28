import '@/lib/proxy'; // 让 Node.js 使用代理
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { query } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // 后续可以添加 Google
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    // 登录时：查找或创建用户
    async signIn({ user, account, profile }) {
      console.log('[Auth] signIn callback:', { user, account: account?.provider });
      
      if (!account) {
        console.log('[Auth] No account, rejecting');
        return false;
      }

      // 如果没有邮箱，尝试用 GitHub 用户名生成一个
      if (!user.email) {
        const githubProfile = profile as { login?: string };
        user.email = githubProfile?.login ? `${githubProfile.login}@github.local` : `${account.providerAccountId}@github.local`;
        console.log('[Auth] No email, using generated:', user.email);
      }

      try {
        // 查找是否已有此 OAuth 账号
        const existingAccounts = await query<{ user_id: number }[]>(
          'SELECT user_id FROM accounts WHERE provider = ? AND provider_account_id = ?',
          [account.provider, account.providerAccountId]
        );

        if (existingAccounts.length > 0) {
          // 已存在，更新 token
          await query(
            `UPDATE accounts SET access_token = ?, refresh_token = ?, expires_at = ? 
             WHERE provider = ? AND provider_account_id = ?`,
            [
              account.access_token ?? null,
              account.refresh_token ?? null,
              account.expires_at ?? null,
              account.provider,
              account.providerAccountId,
            ]
          );
        } else {
          // 新用户：先创建 user，再创建 account
          const result = await query<{ insertId: number }>(
            `INSERT INTO users (username, email, avatar) VALUES (?, ?, ?)`,
            [user.name ?? 'Unknown', user.email, user.image ?? null]
          );
          
          const userId = (result as unknown as { insertId: number }).insertId;

          await query(
            `INSERT INTO accounts (user_id, type, provider, provider_account_id, access_token, refresh_token, expires_at, token_type, scope)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              account.type ?? 'oauth',
              account.provider,
              account.providerAccountId,
              account.access_token ?? null,
              account.refresh_token ?? null,
              account.expires_at ?? null,
              account.token_type ?? null,
              account.scope ?? null,
            ]
          );
        }

        console.log('[Auth] signIn success');
        return true;
      } catch (error) {
        console.error('[Auth] SignIn error:', error);
        return false;
      }
    },

    // JWT 回调：把用户 ID 存到 token 里
    async jwt({ token, user, account }) {
      if (account && user) {
        // 首次登录，查询数据库获取用户 ID
        const users = await query<{ id: number }[]>(
          'SELECT u.id FROM users u JOIN accounts a ON u.id = a.user_id WHERE a.provider = ? AND a.provider_account_id = ?',
          [account.provider, account.providerAccountId]
        );
        if (users.length > 0) {
          token.userId = users[0].id;
        }
      }
      return token;
    },

    // Session 回调：把 token 里的信息传给前端
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = String(token.userId);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // 自定义登录页（可选，先用默认的）
  },
});
