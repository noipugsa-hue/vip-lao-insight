export const useLaoFormula = () => {

  const getHotNumbers = (history: string[]) => {
  const count: Record<string, number> = {}

  history.forEach(num => {
    num.split('').forEach(d => {
      count[d] = (count[d] || 0) + 1
    })
  })

  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // ✅ เอาแค่ 3 ตัว
    .map(([digit]) => digit)
}

  const cutColdNumbers = (history: string[]) => {
    const appeared = new Set(history.join('').split(''))
    return [...Array(10).keys()]
      .map(String)
      .filter(n => !appeared.has(n))
  }

const generateThreeDigits = (hot: string[], cut: string[]) => {
  const results: string[] = []
  const cutSet = new Set(cut)

  for (const a of hot) {
    for (const b of hot) {
      for (const c of hot) {

        if (cutSet.has(a) || cutSet.has(b) || cutSet.has(c)) continue

        const num = a + b + c

        // ❌ ไม่เอาเลขซ้ำทั้งตัว เช่น 111, 222
        if (a === b && b === c) continue

        if (!results.includes(num)) {
          results.push(num)
        }

        // ✅ ครบ 4 ชุดแล้วหยุด
        if (results.length === 4) {
          return results
        }
      }
    }
  }

  return results
}

  const mixFormula = (hot: string[], cut: string[]) => {
    const result: string[] = []

    hot.forEach(a => {
      hot.forEach(b => {
        const pair = a + b
        if (!cut.includes(a) && !cut.includes(b)) {
          result.push(pair)
        }
      })
    })

    return result.slice(0, 6)
  }

  return { getHotNumbers, cutColdNumbers, mixFormula, generateThreeDigits }
}