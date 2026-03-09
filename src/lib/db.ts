import mysql from 'mysql2/promise';

// 数据库连接配置（敏感信息必须通过环境变量配置）
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER || '',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'leetcode',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 扩展 globalThis 类型
declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: mysql.Pool | undefined;
}

// 创建连接池（使用 globalThis 防止开发模式热重载时重复创建）
export function getPool(): mysql.Pool {
  if (!globalThis.mysqlPool) {
    globalThis.mysqlPool = mysql.createPool(dbConfig);
  }
  return globalThis.mysqlPool;
}

// 执行查询的便捷方法
export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

// 关闭连接池
export async function closePool(): Promise<void> {
  if (globalThis.mysqlPool) {
    await globalThis.mysqlPool.end();
    globalThis.mysqlPool = undefined;
  }
}
