-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TransactionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notes" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "categoryName" TEXT,
    CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransactionItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransactionItem_categoryName_fkey" FOREIGN KEY ("categoryName") REFERENCES "Category" ("name") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TransactionItem" ("accountId", "amount", "categoryName", "id", "notes", "transactionId") SELECT "accountId", "amount", "categoryName", "id", "notes", "transactionId" FROM "TransactionItem";
DROP TABLE "TransactionItem";
ALTER TABLE "new_TransactionItem" RENAME TO "TransactionItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
