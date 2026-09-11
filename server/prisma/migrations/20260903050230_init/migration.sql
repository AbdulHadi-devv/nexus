-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "url" TEXT,
    "language" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "KnowledgeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6366f1',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromItemId" TEXT NOT NULL,
    "toItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RELATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Connection_fromItemId_fkey" FOREIGN KEY ("fromItemId") REFERENCES "KnowledgeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Connection_toItemId_fkey" FOREIGN KEY ("toItemId") REFERENCES "KnowledgeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ItemTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ItemTags_A_fkey" FOREIGN KEY ("A") REFERENCES "KnowledgeItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ItemTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_userId_key" ON "Tag"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_fromItemId_toItemId_key" ON "Connection"("fromItemId", "toItemId");

-- CreateIndex
CREATE UNIQUE INDEX "_ItemTags_AB_unique" ON "_ItemTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ItemTags_B_index" ON "_ItemTags"("B");
