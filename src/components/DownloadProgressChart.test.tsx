import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { DownloadProgressChart } from './DownloadProgressChart'
import { parseSpeed } from '../../shared/utilities'

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    on: vi.fn(() => () => {}),
  },
}))

describe('parseSpeed', () => {
  it('parses MB/s', () => {
    expect(parseSpeed('5.2 MB/s')).toBeCloseTo(5.2)
  })

  it('parses MiB/s', () => {
    expect(parseSpeed('10.5 MiB/s')).toBeCloseTo(10.5)
  })

  it('parses KB/s', () => {
    expect(parseSpeed('500 KB/s')).toBeCloseTo(500 / 1024, 4)
  })

  it('parses KiB/s', () => {
    expect(parseSpeed('1024 KiB/s')).toBeCloseTo(1)
  })

  it('parses GB/s', () => {
    expect(parseSpeed('1.5 GiB/s')).toBeCloseTo(1.5 * 1024)
  })

  it('parses B/s', () => {
    expect(parseSpeed('500000 B/s')).toBeCloseTo(500000 / (1024 * 1024), 6)
  })

  it('returns 0 for undefined', () => {
    expect(parseSpeed(undefined)).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(parseSpeed('')).toBe(0)
  })

  it('returns 0 for unrecognized format', () => {
    expect(parseSpeed('fast')).toBe(0)
  })
})

describe('DownloadProgressChart', () => {
  it('renders empty/awaiting state when no data', () => {
    const { getByText } = render(<DownloadProgressChart downloadId="test-id" />)
    expect(getByText('Awaiting data...')).toBeInTheDocument()
  })

  it('accepts className prop', () => {
    const { container } = render(
      <DownloadProgressChart downloadId="test-id" className="custom-class" />,
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('renders without crashing with minimal props', () => {
    const { container } = render(<DownloadProgressChart downloadId="abc-123" />)
    expect(container).toBeTruthy()
  })
})
