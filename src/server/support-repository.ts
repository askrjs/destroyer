import type Database from "better-sqlite3";
import type { AppDependencies } from "./contracts";

export function createSupportRepositories(
  database: Database.Database,
  now: () => number,
): Pick<AppDependencies, "contacts" | "invoices"> {
  return {
    contacts: {
      async create(input) {
        const receipt = { id: crypto.randomUUID(), receivedAt: new Date(now()).toISOString() };
        database
          .prepare("INSERT INTO support_requests VALUES (?, ?, ?, ?, ?)")
          .run(
            receipt.id,
            input.email.trim().toLowerCase(),
            input.subject.trim(),
            input.message.trim(),
            receipt.receivedAt,
          );
        return receipt;
      },
      async count() {
        return (
          database.prepare("SELECT COUNT(*) count FROM support_requests").get() as { count: number }
        ).count;
      },
    },
    invoices: {
      async sampleCsv(principalId) {
        const operator = database
          .prepare("SELECT email FROM principals WHERE id=?")
          .get(principalId) as { email: string } | undefined;
        return [
          "invoice_id,issued_at,customer_email,description,amount_usd,status",
          `INV-DEMO-001,2026-07-01,${operator?.email ?? "operator@example.test"},Destroyer workspace,49.00,paid`,
          "",
        ].join("\r\n");
      },
    },
  };
}
