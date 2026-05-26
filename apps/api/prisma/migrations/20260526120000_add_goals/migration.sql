CREATE TABLE "Goal" (
  "id"          SERIAL PRIMARY KEY,
  "userId"      INTEGER NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT,
  "category"    TEXT NOT NULL,
  "emoji"       TEXT NOT NULL DEFAULT '🎯',
  "frequency"   TEXT NOT NULL DEFAULT 'daily',
  "source"      TEXT NOT NULL DEFAULT 'manual',
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "GoalCompletion" (
  "id"        SERIAL PRIMARY KEY,
  "goalId"    INTEGER NOT NULL,
  "date"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoalCompletion_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "GoalCompletion_goalId_date_key" UNIQUE ("goalId", "date")
);
