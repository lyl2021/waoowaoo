import mysql from 'mysql2/promise'
import { loadTestEnv } from './env'

function parseDbUrl(dbUrl: string) {
  const url = new URL(dbUrl)
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  }
}

export async function runGlobalTeardown() {
  loadTestEnv()

  const shouldBootstrap = process.env.BILLING_TEST_BOOTSTRAP === '1' || process.env.SYSTEM_TEST_BOOTSTRAP === '1'
  if (!shouldBootstrap) return
  if (process.env.BILLING_TEST_KEEP_SERVICES === '1') return

  const db = parseDbUrl(process.env.DATABASE_URL || '')
  if (!db.database) return

  try {
    const conn = await mysql.createConnection({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      connectTimeout: 5_000,
    })
    await conn.query(`DROP DATABASE IF EXISTS \`${db.database}\``)
    await conn.end()
    console.log(`[global-teardown] 已清理测试数据库: ${db.database}`)
  } catch (err) {
    console.warn(`[global-teardown] 清理测试数据库失败:`, (err as Error).message)
  }
}
