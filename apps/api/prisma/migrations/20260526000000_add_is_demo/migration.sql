ALTER TABLE "User" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- Mark the demo account
UPDATE "User" SET "isDemo" = true WHERE email = 'xendke@gmail.com';
