export type QuestionType = 'scale' | 'binary' | 'three_option' | 'free_text'

export interface Question {
  id: number
  text: string
  category: string
  type: QuestionType
  options: string[]
}

export interface QuizResponse {
  questionId: number
  answer: string | null
  skipped: boolean
}

export interface DailyQuiz {
  id: number
  completed: boolean
  skipped: boolean
  questions: Question[]
  responses: QuizResponse[]
}
