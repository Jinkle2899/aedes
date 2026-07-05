import { useEffect, useMemo, useState } from 'react'
import { predict, predictAt, gapSeams } from '../../lib/predict.js'
import { setPredictOn } from '../../lib/blockMeta.js'
import { makeBlock } from '../../lib/store.js'

/* Aedes Flow prediction: the Horizon ghost (Layer 1) and gap seams (Layer 2).
   Extracted verbatim from EditorInner. */
export function usePrediction({ site, meta, preview, setMeta, setSeamOpen, doInsert }) {
  const blocksSig = site.blocks.map((b) => b.id).join(',')
  const predictOn = meta.predictOn !== false
  const prediction = useMemo(
    () => predict(site.blocks, site.kind, meta.counts),
    [site.blocks, site.kind, meta.counts]
  )
  const [ghostCycle, setGhostCycle] = useState(0)
  const [ghostSuppressed, setGhostSuppressed] = useState(null)
  useEffect(() => setGhostCycle(0), [blocksSig])
  const ghostVisible = !preview && predictOn && prediction.show && ghostSuppressed !== blocksSig
  const togglePredict = () => setMeta(setPredictOn(!predictOn))

  const [dismissedGaps, setDismissedGaps] = useState([])
  useEffect(() => setSeamOpen(null), [blocksSig])
  const gapList = useMemo(
    () => gapSeams(site.blocks).filter((g) => !dismissedGaps.includes(g.segment)),
    [site.blocks, dismissedGaps]
  )
  const gapAt = (index) => gapList.find((g) => g.index === index) || null
  const predictAtIndex = (index) => predictAt(site.blocks, index, site.kind, meta.counts)
  const insertAtSeam = (index, type) => {
    doInsert(null, index, makeBlock(type))
    setSeamOpen(null)
  }
  const dismissGap = (segment) => setDismissedGaps((d) => [...d, segment])

  const acceptGhost = (type) => doInsert(null, site.blocks.length, makeBlock(type))
  const dismissGhost = () => setGhostSuppressed(blocksSig)
  const cycleGhost = (dir) =>
    setGhostCycle((c) => (c + dir + prediction.candidates.length) % prediction.candidates.length)

  return {
    blocksSig,
    predictOn,
    prediction,
    ghostCycle,
    ghostVisible,
    togglePredict,
    gapAt,
    predictAtIndex,
    insertAtSeam,
    dismissGap,
    acceptGhost,
    dismissGhost,
    cycleGhost,
  }
}
