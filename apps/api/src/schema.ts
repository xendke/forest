export const typeDefs = `
  type Query {
    hello: String!
    me: User
  }

  type Mutation {
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!, rememberMe: Boolean): AuthPayload!
    updateProfile(firstName: String, dob: String): User!
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
`
