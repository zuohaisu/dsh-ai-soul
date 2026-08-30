export function analyzeProfilePatchShape(patchText = '') {
  const lines = String(patchText).split(/\r?\n/)
  const content = lines
    .map((line, index) => ({ index, value: line.trim() }))
    .filter(({ value }) => value && !value.startsWith('#'))
  const emptySequence = content.find(({ value }) => value === '[]')

  return {
    lines,
    emptySequenceIndex: emptySequence?.index ?? -1,
    valid: emptySequence === undefined || content.length === 1,
  }
}
