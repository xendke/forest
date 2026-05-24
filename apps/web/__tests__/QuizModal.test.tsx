import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuizModal } from '@/components/QuizModal'
import type { DailyQuiz, Question } from '@/types/quiz'

// ── mocks ──────────────────────────────────────────────────────────────────

const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

const mockGql = vi.fn()
vi.mock('@/lib/api', () => ({
  gql: (...args: unknown[]) => mockGql(...args),
}))

// ── fixtures ───────────────────────────────────────────────────────────────

const Q = {
  scale: {
    id: 1,
    text: 'How would you rate your mood today?',
    category: 'Mood',
    type: 'scale' as const,
    options: ['1', '2', '3', '4', '5'],
  } satisfies Question,
  binary: {
    id: 2,
    text: 'Did you experience any calm today?',
    category: 'Anxiety',
    type: 'binary' as const,
    options: ['Yes', 'No'],
  } satisfies Question,
  threeOption: {
    id: 3,
    text: 'Were you able to focus when needed?',
    category: 'Focus',
    type: 'three_option' as const,
    options: ['Yes', 'Mostly', 'No'],
  } satisfies Question,
  freeText: {
    id: 4,
    text: "What's on your mind right now?",
    category: 'Mood',
    type: 'free_text' as const,
    options: [],
  } satisfies Question,
}

function makeQuiz(overrides?: Partial<DailyQuiz>): DailyQuiz {
  return {
    id: 42,
    completed: false,
    skipped: false,
    questions: [Q.scale],
    responses: [],
    ...overrides,
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

/** Render the modal and click Start to reach the question screen. */
async function renderAndStart(quiz = makeQuiz()) {
  const user = userEvent.setup()
  render(<QuizModal initialQuiz={quiz} />)
  await user.click(screen.getByRole('button', { name: /start/i }))
  return user
}

// ── tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockGql.mockResolvedValue({})
  mockRefresh.mockReset()
})

// ── initial screen selection ────────────────────────────────────────────────

describe('initial render', () => {
  it('renders nothing when initialQuiz is null', () => {
    render(<QuizModal initialQuiz={null} />)
    expect(screen.queryByText('Daily Check-in')).not.toBeInTheDocument()
  })

  it('renders nothing when quiz is already completed', () => {
    render(<QuizModal initialQuiz={makeQuiz({ completed: true })} />)
    expect(screen.queryByText('Daily Check-in')).not.toBeInTheDocument()
  })

  it('renders nothing when quiz is already skipped', () => {
    render(<QuizModal initialQuiz={makeQuiz({ skipped: true })} />)
    expect(screen.queryByText('Daily Check-in')).not.toBeInTheDocument()
  })

  it('shows the welcome screen for a fresh, active quiz', () => {
    render(<QuizModal initialQuiz={makeQuiz()} />)
    expect(screen.getByText('Daily Check-in')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip for today/i })).toBeInTheDocument()
  })

  it('fetches quiz data when initialQuiz is not provided', async () => {
    const quiz = makeQuiz()
    mockGql.mockResolvedValueOnce({ todayQuiz: quiz })
    render(<QuizModal />)
    await waitFor(() => {
      expect(screen.getByText('Daily Check-in')).toBeInTheDocument()
    })
    expect(mockGql).toHaveBeenCalledWith(expect.stringContaining('todayQuiz'))
  })

  it('stays hidden if the fetched quiz is already completed', async () => {
    mockGql.mockResolvedValueOnce({ todayQuiz: makeQuiz({ completed: true }) })
    render(<QuizModal />)
    await waitFor(() => {
      expect(mockGql).toHaveBeenCalled()
    })
    expect(screen.queryByText('Daily Check-in')).not.toBeInTheDocument()
  })
})

// ── welcome screen ──────────────────────────────────────────────────────────

describe('welcome screen', () => {
  it('displays the question count', () => {
    render(<QuizModal initialQuiz={makeQuiz({ questions: [Q.scale, Q.binary] })} />)
    expect(screen.getByText(/2 questions/i)).toBeInTheDocument()
  })

  it('clicking Start moves to the question screen', async () => {
    const user = userEvent.setup()
    render(<QuizModal initialQuiz={makeQuiz()} />)
    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(screen.getByText(Q.scale.text)).toBeInTheDocument()
  })

  it('clicking "Skip for today" calls completeQuiz with skipped=true', async () => {
    const user = userEvent.setup()
    render(<QuizModal initialQuiz={makeQuiz()} />)
    await user.click(screen.getByRole('button', { name: /skip for today/i }))
    await waitFor(() => {
      expect(mockGql).toHaveBeenCalledWith(
        expect.stringContaining('completeQuiz'),
        expect.objectContaining({ skipped: true })
      )
    })
  })

  it('hides modal and calls router.refresh after skipping the quiz', async () => {
    const user = userEvent.setup()
    render(<QuizModal initialQuiz={makeQuiz()} />)
    await user.click(screen.getByRole('button', { name: /skip for today/i }))
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledOnce()
      expect(screen.queryByText('Daily Check-in')).not.toBeInTheDocument()
    })
  })
})

// ── question screen ─────────────────────────────────────────────────────────

describe('question screen', () => {
  it('shows the progress counter', async () => {
    await renderAndStart()
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })

  it('shows the correct progress percentage', async () => {
    await renderAndStart(makeQuiz({ questions: [Q.scale, Q.binary] }))
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('displays the category label', async () => {
    await renderAndStart()
    expect(screen.getByText('Mood')).toBeInTheDocument()
  })

  it('displays the question text', async () => {
    await renderAndStart()
    expect(screen.getByText(Q.scale.text)).toBeInTheDocument()
  })

  it('Back button is disabled on the first question', async () => {
    await renderAndStart()
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
  })

  it('Back button navigates to the previous question', async () => {
    const user = await renderAndStart(makeQuiz({ questions: [Q.scale, Q.binary] }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText(Q.binary.text))
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(Q.scale.text)).toBeInTheDocument()
  })

  it('Next calls submitQuizResponse and advances to the next question', async () => {
    const user = await renderAndStart(makeQuiz({ questions: [Q.scale, Q.binary] }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(mockGql).toHaveBeenCalledWith(
        expect.stringContaining('submitQuizResponse'),
        expect.objectContaining({ quizId: 42, questionId: Q.scale.id })
      )
      expect(screen.getByText(Q.binary.text)).toBeInTheDocument()
    })
  })

  it('last question shows "Submit" instead of "Next"', async () => {
    await renderAndStart()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
  })

  it('Submit calls completeQuiz with skipped=false and shows done screen', async () => {
    await renderAndStart()
    await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => {
      expect(mockGql).toHaveBeenCalledWith(
        expect.stringContaining('completeQuiz'),
        expect.objectContaining({ quizId: 42, skipped: false })
      )
      expect(screen.getByText(/all done for today/i)).toBeInTheDocument()
    })
  })

  it('"Skip this question" calls submitQuizResponse with skipped=true', async () => {
    const user = await renderAndStart()
    await user.click(screen.getByRole('button', { name: /skip this question/i }))
    await waitFor(() => {
      expect(mockGql).toHaveBeenCalledWith(
        expect.stringContaining('submitQuizResponse'),
        expect.objectContaining({ skipped: true })
      )
    })
  })
})

// ── input components ────────────────────────────────────────────────────────

describe('input components', () => {
  it('renders five scale buttons for a scale question', async () => {
    await renderAndStart(makeQuiz({ questions: [Q.scale] }))
    const scaleBtns = screen.getAllByRole('button', { name: /^[1-5]$/ })
    expect(scaleBtns).toHaveLength(5)
  })

  it('renders option buttons for a binary question', async () => {
    await renderAndStart(makeQuiz({ questions: [Q.binary] }))
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })

  it('renders all three options for a three_option question', async () => {
    await renderAndStart(makeQuiz({ questions: [Q.threeOption] }))
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mostly' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })

  it('renders a textarea for a free_text question', async () => {
    await renderAndStart(makeQuiz({ questions: [Q.freeText] }))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/write freely/i)).toBeInTheDocument()
  })

  it('selecting a scale option updates the active button', async () => {
    const user = await renderAndStart(makeQuiz({ questions: [Q.scale] }))
    const btn3 = screen.getByRole('button', { name: '3' })
    await user.click(btn3)
    // Active scale button gets shadow-primary class applied
    expect(btn3.className).toContain('shadow-primary')
  })

  it('typing in a free_text input updates its value', async () => {
    const user = await renderAndStart(makeQuiz({ questions: [Q.freeText] }))
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Feeling good today')
    expect(textarea).toHaveValue('Feeling good today')
  })
})

// ── done screen ─────────────────────────────────────────────────────────────

describe('done screen', () => {
  async function reachDoneScreen() {
    const user = await renderAndStart()
    await user.click(screen.getByRole('button', { name: /submit/i }))
    await waitFor(() => screen.getByText(/all done for today/i))
    return user
  }

  it('shows the completion heading', async () => {
    await reachDoneScreen()
    expect(screen.getByText('All done for today.')).toBeInTheDocument()
  })

  it('Close button hides the modal', async () => {
    const user = await reachDoneScreen()
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText(/all done for today/i)).not.toBeInTheDocument()
  })

  it('Close button calls router.refresh', async () => {
    const user = await reachDoneScreen()
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(mockRefresh).toHaveBeenCalledOnce()
  })
})

// ── reopen (prop update) flow ───────────────────────────────────────────────

describe('reopen flow (prop update after router.refresh)', () => {
  it('shows welcome screen when a skipped quiz is updated to active', async () => {
    const { rerender } = render(<QuizModal initialQuiz={makeQuiz({ skipped: true })} />)
    expect(screen.queryByText('Daily Check-in')).not.toBeInTheDocument()

    rerender(<QuizModal initialQuiz={makeQuiz()} />)

    await waitFor(() => {
      expect(screen.getByText('Daily Check-in')).toBeInTheDocument()
    })
  })

  it('does not re-open when a completed quiz prop is passed in', async () => {
    const { rerender } = render(<QuizModal initialQuiz={makeQuiz()} />)
    expect(screen.getByText('Daily Check-in')).toBeInTheDocument()

    rerender(<QuizModal initialQuiz={makeQuiz({ completed: true })} />)

    await waitFor(() => {
      expect(screen.queryByText('Daily Check-in')).not.toBeInTheDocument()
    })
  })
})
