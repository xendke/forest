export const typeDefs = `
  type Query {
    hello: String!
    me: User
    todayQuiz: DailyQuiz
    quizHistory(days: Int): [DailyQuizHistory!]!
    streakInfo: StreakInfo!
    journalEntries(limit: Int, offset: Int): [JournalEntry!]!
    aiInsights: InsightsResult!
    goals: [Goal!]!
    goalSuggestions: [GoalSuggestion!]!
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!, rememberMe: Boolean): AuthPayload!
    demoLogin: AuthPayload!
    updateProfile(firstName: String, dob: String): User!
    submitQuizResponse(quizId: Int!, questionId: Int!, answer: String, skipped: Boolean): QuizResponse!
    completeQuiz(quizId: Int!, skipped: Boolean): DailyQuiz!
    reopenQuiz(quizId: Int!): DailyQuiz!
    createJournalEntry(content: String!): JournalEntry!
    updateJournalEntry(id: Int!, content: String!): JournalEntry!
    deleteJournalEntry(id: Int!): Boolean!
    refreshInsights: InsightsResult!
    createGoal(title: String!, description: String, category: String!, emoji: String!, frequency: String, source: String): Goal!
    toggleGoalCompletion(goalId: Int!, date: String!): Goal!
    archiveGoal(goalId: Int!): Boolean!
  }

  type User {
    id: Int!
    email: String!
    firstName: String
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Question {
    id: Int!
    text: String!
    category: String!
    type: String!
    isQuick: Boolean!
    options: [String!]!
  }

  type QuizResponse {
    id: Int!
    questionId: Int!
    answer: String
    skipped: Boolean!
  }

  type DailyQuiz {
    id: Int!
    date: String!
    completed: Boolean!
    skipped: Boolean!
    questions: [Question!]!
    responses: [QuizResponse!]!
  }

  type DailyQuizHistory {
    date: String!
    wellbeing: Float
    mood: Float
    calm: Float
    focus: Float
  }

  type DayStatus {
    date: String!
    status: String!
  }

  type StreakInfo {
    current: Int!
    best: Int!
    last7: [DayStatus!]!
  }

  type JournalEntry {
    id: Int!
    content: String!
    createdAt: String!
    updatedAt: String!
  }

  type InsightItem {
    type: String!
    emoji: String!
    insight: String!
    detail: String
  }

  type InsightsResult {
    items: [InsightItem!]!
    generatedAt: String
    isExample: Boolean!
  }

  type Goal {
    id: Int!
    title: String!
    description: String
    category: String!
    emoji: String!
    frequency: String!
    source: String!
    completedToday: Boolean!
    currentStreak: Int!
    totalCompletions: Int!
    createdAt: String!
  }

  type GoalSuggestion {
    title: String!
    description: String
    category: String!
    emoji: String!
    frequency: String!
    isRecommended: Boolean!
  }
`
