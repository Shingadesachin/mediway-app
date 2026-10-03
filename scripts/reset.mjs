// Deletes the local database. It is recreated with fresh demo data on the next request.
import { rmSync } from "node:fs";
for (const f of ["data/mediway.db", "data/mediway.db-wal", "data/mediway.db-shm"]) rmSync(f, { force: true });
console.log("Database removed. Restart the app to reseed.");
