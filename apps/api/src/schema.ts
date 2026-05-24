export const typeDefs = `
  type Query {
    hello: String!
    me: User
    todayQuiz: DailyQuiz
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!, rememberMe: Boolean): AuthPayload!
    updateProfile(firstName: String, dob: String): User!
    submitQuizResponse(quizId: Int!, questionId: Int!, answer: String, skipped: Boolean): QuizResponse!
    completeQuiz(quizId: Int!, skipped: Boolean): DailyQuiz!
    reopenQuiz(quizId: Int!): DailyQuiz!
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
`
