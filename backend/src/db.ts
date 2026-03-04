import { Database } from "bun:sqlite";

export const db = new Database("mockapi.sqlite", { create: true });

export function setupDatabase() {
  // Check if table exists before running setup
  const tableExists = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='endpoints'").get();
  
  if (!tableExists) {
    db.query(`
      CREATE TABLE endpoints (
        hash TEXT PRIMARY KEY,
        method TEXT NOT NULL,
        response_code INTEGER NOT NULL,
        response_body TEXT NOT NULL,
        response_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `).run();

    db.query(`
      CREATE INDEX idx_endpoints_created_at ON endpoints(created_at);
    `).run();
    console.log("Database initialized.");
  }
}

setupDatabase();

export interface Endpoint {
  hash: string;
  method: string;
  response_code: number;
  response_body: string;
  response_type: string;
  created_at?: string;
}

export function createEndpoint(endpoint: Endpoint) {
  const query = db.query(`
    INSERT INTO endpoints (hash, method, response_code, response_body, response_type)
    VALUES ($hash, $method, $response_code, $response_body, $response_type)
  `);
  
  query.run({
    $hash: endpoint.hash,
    $method: endpoint.method,
    $response_code: endpoint.response_code,
    $response_body: endpoint.response_body,
    $response_type: endpoint.response_type,
  });
}

export function getEndpoint(hash: string): Endpoint | null {
  const query = db.query(`SELECT * FROM endpoints WHERE hash = $hash`);
  return query.get({ $hash: hash }) as Endpoint | null;
}

export function deleteEndpoint(hash: string) {
  db.query(`DELETE FROM endpoints WHERE hash = $hash`).run({ $hash: hash });
}

export function cleanupExpiredEndpoints() {
  // 7 days TTL
  const query = db.query(`
    DELETE FROM endpoints WHERE created_at < datetime('now', '-7 days')
  `);
  query.run();
}
