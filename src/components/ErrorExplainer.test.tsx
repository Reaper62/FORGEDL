import { describe, expect, it, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { ErrorExplainer } from './ErrorExplainer'
import { classifyError, type ErrorCategory } from '../../shared/utilities'

describe('classifyError', () => {
  it('classifies network errors', () => {
    expect(classifyError('Unable to download webpage: connection timed out').category).toBe(
      'network',
    )
  })
  it('classifies format errors', () => {
    expect(classifyError('Requested format is not available').category).toBe('format')
  })
  it('classifies ffmpeg errors', () => {
    expect(classifyError('ffmpeg: postprocessing failed').category).toBe('ffmpeg')
  })
  it('classifies permission errors', () => {
    expect(classifyError('Permission denied: cannot write file').category).toBe('permissions')
  })
  it('classifies auth errors', () => {
    expect(classifyError('Sign in to confirm your age').category).toBe('auth')
  })
  it('classifies geo-restriction errors', () => {
    expect(classifyError('This video is not available in your country').category).toBe('geo')
  })
  it('classifies rate-limit errors', () => {
    expect(classifyError('HTTP Error 429: Too Many Requests').category).toBe('rate_limit')
  })
  it('classifies extractor errors', () => {
    expect(classifyError('Unsupported URL: no extractor found').category).toBe('extractor')
  })
  it('classifies disk-full errors', () => {
    expect(classifyError('No space left on device: ENOSPC').category).toBe('disk')
  })
  it('falls back to unknown', () => {
    expect(classifyError('Something unexpected').category).toBe('unknown')
  })
  it('is case-insensitive', () => {
    expect(classifyError('UNABLE TO DOWNLOAD WEBPAGE').category).toBe('network')
  })
})

describe('ErrorExplainer component', () => {
  it('renders collapsed with label', () => {
    const { queryAllByText, queryByText } = render(<ErrorExplainer error="connection timed out" />)
    expect(queryAllByText('Network Error').length).toBeGreaterThanOrEqual(1)
    expect(queryByText(/Your connection to the server/i)).not.toBeInTheDocument()
  })

  it('expands on click', () => {
    const { getAllByRole, getByText } = render(
      <ErrorExplainer error="HTTP Error 429: Too Many Requests" />,
    )
    const buttons = getAllByRole('button')
    const btn = buttons.find((b) => b.textContent?.includes('Rate Limited'))
    expect(btn).toBeTruthy()
    fireEvent.click(btn!)
    expect(getByText(/The server is temporarily blocking/i)).toBeInTheDocument()
  })

  it('renders expanded by default with isExpanded=true', () => {
    const { getByText } = render(<ErrorExplainer error="permission denied" isExpanded={true} />)
    expect(getByText(/The app cannot write/i)).toBeInTheDocument()
  })

  it('calls onFix when fix button clicked', () => {
    const onFix = vi.fn()
    const { getByText } = render(
      <ErrorExplainer error="ffmpeg: merge failed" isExpanded={true} onFix={onFix} />,
    )
    fireEvent.click(getByText('Check FFmpeg'))
    expect(onFix).toHaveBeenCalledWith('ffmpeg' as ErrorCategory)
  })

  it('shows raw error output', () => {
    const { queryAllByText, getByText } = render(
      <ErrorExplainer error="connection refused" isExpanded={true} />,
    )
    expect(queryAllByText(/Raw error output/i).length).toBeGreaterThanOrEqual(1)
    expect(getByText('connection refused')).toBeInTheDocument()
  })

  it('toggles expand on click', () => {
    const { getAllByRole, queryAllByText } = render(<ErrorExplainer error="timed out" />)
    const buttons = getAllByRole('button')
    const btn = buttons.find((b) => b.textContent?.includes('Network Error'))
    expect(btn).toBeTruthy()
    // Expand — description should appear
    fireEvent.click(btn!)
    expect(queryAllByText(/Your connection to the server/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders unknown category', () => {
    const { getAllByRole } = render(<ErrorExplainer error="xyzzy magic error" isExpanded={true} />)
    const buttons = getAllByRole('button')
    const btn = buttons.find((b) => b.textContent?.includes('Unexpected Error'))
    expect(btn).toBeTruthy()
    expect(btn).toBeInTheDocument()
  })

  it('no fix button without onFix', () => {
    const { queryByText } = render(<ErrorExplainer error="network error" isExpanded={true} />)
    expect(queryByText('Retry')).not.toBeInTheDocument()
  })
})
