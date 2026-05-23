-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isQuick" BOOLEAN NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuiz" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResponse" (
    "id" SERIAL NOT NULL,
    "quizId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "answer" TEXT,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable (implicit many-to-many join for DailyQuiz <-> Question)
CREATE TABLE "_DailyQuizToQuestion" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "DailyQuiz_userId_date_key" ON "DailyQuiz"("userId", "date");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "QuizResponse_quizId_questionId_key" ON "QuizResponse"("quizId", "questionId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "_DailyQuizToQuestion_AB_unique" ON "_DailyQuizToQuestion"("A", "B");

-- CreateIndex
CREATE INDEX "_DailyQuizToQuestion_B_index" ON "_DailyQuizToQuestion"("B");

-- AddForeignKey
ALTER TABLE "DailyQuiz" ADD CONSTRAINT "DailyQuiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "DailyQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResponse" ADD CONSTRAINT "QuizResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyQuizToQuestion" ADD CONSTRAINT "_DailyQuizToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyQuizToQuestion" ADD CONSTRAINT "_DailyQuizToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
