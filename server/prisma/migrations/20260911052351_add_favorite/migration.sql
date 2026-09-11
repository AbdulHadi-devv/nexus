-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "url" TEXT,
    "language" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "KnowledgeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_KnowledgeItem" ("content", "createdAt", "id", "language", "title", "type", "updatedAt", "url", "userId") SELECT "content", "createdAt", "id", "language", "title", "type", "updatedAt", "url", "userId" FROM "KnowledgeItem";
DROP TABLE "KnowledgeItem";
ALTER TABLE "new_KnowledgeItem" RENAME TO "KnowledgeItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
