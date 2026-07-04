/*
 * Page grammar — parses a page's top-level blocks into narrative segments:
 * opening → body → proof → conversion → closing (utility blocks ignored).
 */
import { DNA } from './blockDNA.js'

export const SEGMENTS = ['opening', 'body', 'proof', 'conversion', 'closing']

export const SEGMENT_PHRASES = {
  opening: 'pages start here',
  body: 'builds out the page',
  proof: 'adds social proof here',
  conversion: 'time to convert visitors',
  closing: 'pages end with a footer',
}

export function parse(blocks) {
  const flow = blocks.filter((b) => DNA[b.type] && DNA[b.type].grammar !== 'utility')
  const present = new Set(flow.map((b) => b.type))
  const segments = new Set(flow.map((b) => DNA[b.type].grammar))
  const last = flow[flow.length - 1] || null
  return {
    flow,
    present,
    segments,
    last,
    lastSegment: last ? DNA[last.type].grammar : null,
    hasNavbar: present.has('navbar'),
    hasFooter: present.has('footer'),
  }
}

/* Which segments are structurally missing (for gap detection / Phase 3) */
export function gaps(blocks) {
  const { segments, flow } = parse(blocks)
  if (flow.length < 3) return []
  return SEGMENTS.filter((s) => s !== 'closing' && !segments.has(s))
}
