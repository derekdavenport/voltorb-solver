import { useState } from 'react'
import './App.css'

type NumVoltorbs = 0 | 1 | 2 | 3 | 4
type NumVoltorbsInput = NumVoltorbs | ''
type Coin = 1 | 2 | 3
type CoinSum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
type CoinSumInput = CoinSum | ''
type Voltorb = 0
type Val = Coin | Voltorb
type PossibleVals = Set<Val>
type Combo = Val[]
type Combos = Combo[]
type Table = PossibleVals[][]

function isCoinSumArray(a: CoinSumInput[]): a is CoinSum[] {
  return !a.some(num => num === '')
}
function isNumVoltorbsArray(a: NumVoltorbsInput[]): a is NumVoltorbs[] {
  return !a.some(num => num === '')
}

const allVals = [0, 1, 2, 3] as const

const defaultPossibleVals: PossibleVals = new Set<Val>([0, 1, 2, 3])
const defaultTable: Table = Array(5).fill(Array(5).fill(defaultPossibleVals))

function probabilityToRGB(probability: number): string {
  probability = Math.max(0, Math.min(1, probability))
  let red = 0, green = 0

  if (probability < 0.5) {
    red = Math.round(510 * probability)
    green = 255
  }
  else {
    red = 255
    green = Math.round(255 - 510 * (probability - 0.5))
  }
  return `rgb(${red}, ${green}, 0)`
}


/**
 * 
 * @param coinSum coin sum for this row/column
 * @param numVoltorbs number of Voltorbs in this row/column
 * @returns all possible combinations of coin values (1, 2, 3) and Voltorbs for this row/column
 */
function getCombos(coinSum: CoinSum, numVoltorbs: NumVoltorbs): Combos {
  const combos: Combos = []
  const maxLength = 5

  function build(current: Val[], currentSum: number, voltorbsUsed: number) {
    if (current.length === maxLength) {
      if (currentSum === coinSum && voltorbsUsed === numVoltorbs) {
        combos.push([...current])
      }
      return
    }

    for (const val of allVals) {
      const newSum = currentSum + val
      const newVoltorbsUsed = voltorbsUsed + +!val

      if (newSum > coinSum || newVoltorbsUsed > numVoltorbs) continue

      current.push(val)
      build(current, newSum, newVoltorbsUsed)
      current.pop()
    }
  }
  
  build([], 0, 0)
  return combos
}

function Cell({ vals, pickVal, bg }: { vals: PossibleVals, pickVal: (coin: Coin) => void, bg: React.CSSProperties['backgroundColor']}) {
  // TODO: actually don't show big number until clicked
	return vals.size === 1 ? 
    <div style={{
      fontSize: '200%'
    }}>{[...vals][0] || 'O'}</div>
  
  : <table style={{
    backgroundColor: bg
  }}>
    <tbody>
      <tr>
        <td style={{cursor: 'default', color: 'black'}}>{vals.has(0) ? 'O' : ''}</td>
        <td onClick={() => pickVal(1)} style={{cursor: 'pointer', color: 'black'}}>{vals.has(1) ? '1' : ''}</td>
      </tr>
      <tr>
        <td onClick={() => pickVal(2)} style={{cursor: 'pointer', color: 'black'}}>{vals.has(2) ? '2' : ''}</td>
        <td onClick={() => pickVal(3)} style={{cursor: 'pointer', color: 'black'}}>{vals.has(3) ? '3' : ''}</td>
      </tr>
    </tbody>
  </table>
}

const defaults: {
  numVoltByRow: NumVoltorbs[],
  numVoltByCol: NumVoltorbs[],
  sumCoinByRow: CoinSum[],
  sumCoinByCol: CoinSum[],
}[] = [
  {
    numVoltByRow: [3,2,1,3,1],
    numVoltByCol: [2,3,2,1,2],
    sumCoinByRow: [4,5,6,4,10],
    sumCoinByCol: [5,4,7,8,5],
  },
  {
    numVoltByRow: [2,2,3,0,3],
    numVoltByCol: [2,2,3,2,1],
    sumCoinByRow: [6,5,5,9,3],
    sumCoinByCol: [7,5,5,5,6],
  },
  {
    numVoltByRow: [1,1,3,3,2],
    numVoltByCol: [3,2,3,2,0],
    sumCoinByRow: [6,8,4,5,4],
    sumCoinByCol: [4,5,3,4,11],
  },
]

function App() {
  const [table, setTable] = useState(defaultTable)

  const [numVoltByRowInput, setNumVoltByRowInput] = useState<NumVoltorbsInput[]>(['', '', '', '', ''])
  const [numVoltByColInput, setNumVoltByColInput] = useState<NumVoltorbsInput[]>(['', '', '', '', ''])
  const [sumCoinByRowInput, setSumCoinByRowInput] = useState<CoinSumInput[]>(['', '', '', '', ''])
  const [sumCoinByColInput, setSumCoinByColInput] = useState<CoinSumInput[]>(['', '', '', '', ''])

  const [numVoltByRow, setNumVoltByRow] = useState<NumVoltorbs[]>([])
  const [numVoltByCol, setNumVoltByCol] = useState<NumVoltorbs[]>([])
  const [sumCoinByRow, setSumCoinByRow] = useState<CoinSum[]>([])
  const [sumCoinByCol, setSumCoinByCol] = useState<CoinSum[]>([])

  const [combosByRow, setCombosByRow] = useState<Combos[]>([[],[],[],[],[]])
  const [combosByCol, setCombosByCol] = useState<Combos[]>([[],[],[],[],[]])

  function go() {
    // get all possible combos for each row and column
    const newCombosByRow = combosByRow.map((_, row) => getCombos(sumCoinByRow[row], numVoltByRow[row]))
    const newCombosByCol = combosByCol.map((_, col) => getCombos(sumCoinByCol[col], numVoltByCol[col]))
    // update the table
    update([...table], newCombosByRow, newCombosByCol)
  }

  function update(newTable: Table, combosByRow: Combos[], combosByCol: Combos[]) {
    // keep track of updates to see when done (table stops changing)
    let comboTotalsByRow = combosByRow.map(rowCombos => rowCombos.length)
    let comboTotalsByCol = combosByCol.map(colCombos => colCombos.length)
    let done = false

    let newCombosByRow: Combos[], newCombosByCol: Combos[]
    do {
      newCombosByRow = combosByRow.map((rowCombos, row) => {
        const newRowCombos = rowCombos.filter(rowCombo => rowCombo.every((val, col) => newTable[row][col].has(val)))
        const s = newRowCombos.reduce(
          (s, combo) => (combo.forEach((val, col) => s[col].add(val)), s),
          [new Set<Val>(), new Set<Val>(), new Set<Val>(), new Set<Val>(), new Set<Val>()]
        )
        s.forEach((p, col) => newTable[row][col] = p)
        return newRowCombos
      })
      newCombosByCol = combosByCol.map((colCombos, col) => {
        const newColCombos = colCombos.filter(colCombo => colCombo.every((val, row) => newTable[row][col].has(val)))
        const s = newColCombos.reduce(
          (s, combo) => (combo.forEach((val, row) => s[row].add(val)), s),
          [new Set<Val>(), new Set<Val>(), new Set<Val>(), new Set<Val>(), new Set<Val>()]
        )
        s.forEach((p, row) => newTable[row][col] = p)
        return newColCombos
      })

      // see if anything changed
      done = (
        newCombosByCol.every((colCombos, i) => colCombos.length === comboTotalsByCol[i]) &&
        newCombosByRow.every((rowCombos, i) => rowCombos.length === comboTotalsByRow[i])
      )
      comboTotalsByRow = newCombosByRow.map(rowCombos => rowCombos.length)
      comboTotalsByCol = newCombosByCol.map(colCombos => colCombos.length)
    } while (!done)
    setTable([...newTable])
    setCombosByRow(newCombosByRow)
    setCombosByCol(newCombosByCol)
  }

  function calcBg(row: number, col: number) {
    // TODO: calc all at once, sort, and label best guesses
    let sum = combosByRow[row].reduce((sum, combo) => {
      return sum + +!combo[col]
    }, 0)
    sum += combosByCol[col].reduce((sum, combo) => {
      return sum + +!combo[row]
    }, sum)
    //sum--
    const denom = combosByRow[row].length + combosByCol[col].length// - 1
    const percentVoltorbs = denom ? sum / denom : 0
    console.log(row, col, sum, denom, percentVoltorbs)
    return probabilityToRGB(percentVoltorbs)
  }

  return (
    <>
      Load default: {defaults.map((d, i) => (
          <button key={i} onClick={() => {
            setSumCoinByRowInput(d.sumCoinByRow)
            setSumCoinByRow(d.sumCoinByRow)
            setSumCoinByColInput(d.sumCoinByCol)
            setSumCoinByCol(d.sumCoinByCol)
            setNumVoltByRowInput(d.numVoltByRow)
            setNumVoltByRow(d.numVoltByRow)
            setNumVoltByColInput(d.numVoltByCol)
            setNumVoltByCol(d.numVoltByCol)
          }}>{i}</button>
        ))}
      <table>
        <tbody>
          {table.map((possibleValsRow, row) => (
            <tr key={row}>
              {possibleValsRow.map((vals, col) => (
                <td key={col}>
                  <Cell vals={vals} pickVal={(coin: Coin) => {
                    const t = [...table]
                    t[row][col] = new Set<Val>([coin])
                    update(t, combosByRow, combosByCol)
                  }}
                  bg={calcBg(row, col)}/>
                </td>
              ))}
              <td>
                <input size={1} value={sumCoinByRowInput[row]} onChange={(e) => setSumCoinByRowInput(sum => {
                  const newSum = [...sum]
                  newSum[row] = (Math.min(Math.max(Number(e.target.value), 1), 15) ?? '') as CoinSumInput
                  setSumCoinByRow(isCoinSumArray(newSum) ? newSum : [])
                  return newSum
                })} type="text"/>
                <input size={1} value={numVoltByRowInput[row]} type="text" onChange={e => setNumVoltByRowInput(num => {
                  const newNum = [...num]
                  newNum[row] = (Math.min(Math.max(Number(e.target.value), 0), 4) as NumVoltorbs ?? '')
                  setNumVoltByRow(isNumVoltorbsArray(newNum) ? newNum : [])
                  return newNum
                })}/>&nbsp;
                {(row in combosByRow) && combosByRow[row].length}
              </td>
            </tr>
          ))}
          <tr>
            {numVoltByColInput.map((_, i) => (
              <td key={i}>
                <input size={1} value={sumCoinByColInput[i]} type="text" onChange={e => setSumCoinByColInput(sum => {
                  const newSum = [...sum]
                  newSum[i] = (Math.min(Math.max(Number(e.target.value), 1), 15) ?? '') as CoinSumInput
                  setSumCoinByCol(isCoinSumArray(newSum) ? newSum : [])
                  return newSum
                })}/>
                <input size={1} value={numVoltByColInput[i]} type="text" onChange={e => setNumVoltByColInput(num => {
                  const newNum = [...num]
                  newNum[i] = (Math.min(Math.max(Number(e.target.value), 0), 4) ?? '') as NumVoltorbsInput
                  setNumVoltByCol(isNumVoltorbsArray(newNum) ? newNum : [])
                  return newNum
                })}/><br />
                {(i in combosByCol) && combosByCol[i].length}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <button onClick={() => go()} disabled={!numVoltByRow.length || !numVoltByCol.length || !sumCoinByRow.length || !sumCoinByCol.length}>Go</button>
    </>
  )
}

export default App
