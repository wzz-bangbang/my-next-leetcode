import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    // 邮箱密码登录
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 查询状态正常的用户（status = 0 或 NULL 表示正常，status = 1 表示已注销）
          const users = await query<{
            id: number;
            username: string;
            email: string;
            password_hash: string | null;
            avatar: string | null;
          }[]>(
            'SELECT id, username, email, password_hash, avatar FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
            [credentials.email]
          );

          if (users.length === 0) {
            console.log('[Auth] User not found or deactivated:', credentials.email);
            return null;
          }

          const user = users[0];

          // 检查是否有密码（OAuth 用户可能没有密码）
          if (!user.password_hash) {
            console.log('[Auth] User has no password (OAuth user):', credentials.email);
            return null;
          }

          // 验证密码
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );

          if (!isValid) {
            console.log('[Auth] Invalid password for:', credentials.email);
            return null;
          }

          console.log('[Auth] Credentials login success:', credentials.email);
          return {
            id: String(user.id),
            email: user.email,
            name: user.username,
            image: user.avatar,
          };
        } catch (error) {
          console.error('[Auth] Credentials authorize error:', error);
          return null;
        }
      },
    }),
    // 验证码登录
    Credentials({
      id: 'code',
      name: 'code',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        code: { label: '验证码', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.code) {
          return null;
        }

        try {
          const email = credentials.email as string;
          const code = credentials.code as string;

          // 1. 检查验证码是否存在且有效
          const codes = await query<{
            id: number;
            verify_attempts: number;
            locked_until: Date | null;
          }[]>(
            `SELECT id, verify_attempts, locked_until FROM email_verification_codes 
             WHERE email = ? AND code = ? AND used = 0 AND expires_at > NOW()`,
            [email, code]
          );

          if (codes.length === 0) {
            console.log('[Auth] Invalid or expired code for:', email);
            // 记录失败次数
            await query(
              `UPDATE email_verification_codes SET verify_attempts = verify_attempts + 1 WHERE email = ? AND used = 0`,
              [email]
            );
            return null;
          }

          const codeRecord = codes[0];

          // 2. 检查是否被锁定
          if (codeRecord.locked_until && new Date(codeRecord.locked_until) > new Date()) {
            console.log('[Auth] Code login locked for:', email);
            return null;
          }

          // 3. 检查尝试次数（超过5次锁定30分钟）
          if (codeRecord.verify_attempts >= 5) {
            await query(
              `UPDATE email_verification_codes SET locked_until = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE id = ?`,
              [codeRecord.id]
            );
            console.log('[Auth] Too many attempts, locking:', email);
            return null;
          }

          // 4. 验证成功，标记验证码已使用
          await query(
            `UPDATE email_verification_codes SET used = 1 WHERE id = ?`,
            [codeRecord.id]
          );

          // 5. 查找或创建用户
          let users = await query<{
            id: number;
            username: string;
            email: string;
            avatar: string | null;
          }[]>(
            'SELECT id, username, email, avatar FROM users WHERE email = ? AND (status IS NULL OR status = 0)',
            [email]
          );

          let user;
          if (users.length === 0) {
            // 新用户：自动注册
            const result = await query<{ insertId: number }>(
              `INSERT INTO users (username, email) VALUES (?, ?)`,
              [email.split('@')[0], email]
            );
            const userId = (result as unknown as { insertId: number }).insertId;
            user = { id: userId, username: email.split('@')[0], email, avatar: null };
            console.log('[Auth] Code login - new user created:', email);
          } else {
            user = users[0];
          }

          console.log('[Auth] Code login success:', email);
          return {
            id: String(user.id),
            email: user.email,
            name: user.username,
            image: user.avatar,
          };
        } catch (error) {
          console.error('[Auth] Code authorize error:', error);
          return null;
        }
      },
    }),
    // Google 登录
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // 登录时：查找或创建用户
    async signIn({ user, account, profile }) {
      console.log('[Auth] signIn callback:', { user, account: account?.provider });
      
      if (!account) {
        console.log('[Auth] No account, rejecting');
        return false;
      }

      // Credentials / Code 登录：已在 authorize 中验证，直接放行
      if (account.provider === 'credentials' || account.provider === 'code') {
        return true;
      }

      try {
        // 查找是否已有此 OAuth 账号
        const existingAccounts = await query<{ user_id: number }[]>(
          'SELECT user_id FROM accounts WHERE provider = ? AND provider_account_id = ?',
          [account.provider, account.providerAccountId]
        );

        if (existingAccounts.length > 0) {
          const oldUserId = existingAccounts[0].user_id;
          
          // 检查用户是否已注销
          const userStatus = await query<{ status: number | null }[]>(
            'SELECT status FROM users WHERE id = ?',
            [oldUserId]
          );
          
          if (userStatus.length > 0 && userStatus[0].status === 1) {
            // 用户已注销：创建新用户，保留旧 user_id 到历史记录
            console.log('[Auth] User deactivated, creating new user. Old user_id:', oldUserId);
            
            // 1. 创建新用户
            const newUserResult = await query<{ insertId: number }>(
              `INSERT INTO users (username, email, avatar) VALUES (?, ?, ?)`,
              [user.name ?? 'Unknown', user.email ?? null, user.image ?? null]
            );
            const newUserId = (newUserResult as unknown as { insertId: number }).insertId;
            
            // 2. 获取当前的 deactivated_user_ids
            const accountData = await query<{ deactivated_user_ids: number[] | null }[]>(
              'SELECT deactivated_user_ids FROM accounts WHERE provider = ? AND provider_account_id = ?',
              [account.provider, account.providerAccountId]
            );
            const existingIds = accountData[0]?.deactivated_user_ids ?? [];
            const updatedIds = [...existingIds, oldUserId];
            
            // 3. 更新 accounts：新 user_id + 历史记录 + token
            await query(
              `UPDATE accounts SET 
                user_id = ?, 
                deactivated_user_ids = ?,
                access_token = ?, 
                refresh_token = ?, 
                expires_at = ?
               WHERE provider = ? AND provider_account_id = ?`,
              [
                newUserId,
                JSON.stringify(updatedIds),
                account.access_token ?? null,
                account.refresh_token ?? null,
                account.expires_at ?? null,
                account.provider,
                account.providerAccountId,
              ]
            );
          } else {
            // 用户正常：只更新 OAuth token
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
          }
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
      if (user) {
        // Credentials / Code 登录：user.id 已经是数据库 ID
        if (account?.provider === 'credentials' || account?.provider === 'code') {
          token.userId = Number(user.id);
        }
        // OAuth 登录：需要查询数据库获取用户 ID
        else if (account) {
          const users = await query<{ id: number }[]>(
            'SELECT u.id FROM users u JOIN accounts a ON u.id = a.user_id WHERE a.provider = ? AND a.provider_account_id = ?',
            [account.provider, account.providerAccountId]
          );
          if (users.length > 0) {
            token.userId = users[0].id;
          }
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
