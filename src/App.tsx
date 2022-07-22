import React, { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { getData } from './utils/gdocs'
import splitFlapDisplayAudio from './split-flap-display.wav'

const POLL_INTERVAL = 5 * 1000

interface Row {
  itemID: number
  itemName: string
  bidderID: number
  bidAmount: string
}

const FLAP_CHARS = ' AB0CD1EF2GH3IJ4KL5MN6OP7QR8ST9UV0WX$YZ,.'
const FLAP_INTERVAL = 100

function FlapGroup({ s, length, align, setFlappingCallbacks }: { s: string, length: number, align: 'left' | 'right', setFlappingCallbacks: (setter: (callbacks: IsFlappingCallback[]) => IsFlappingCallback[]) => void }) {
  return <div className='FlapGroup'>{s.padStart(align === 'right' ? length : 0, ' ').padEnd(align === 'left' ? length : 0, ' ').split('').map((c, j) => <Flap key={j} c={c} setFlappingCallbacks={setFlappingCallbacks} />)}</div>
}

function Flap({ c, setFlappingCallbacks }: { c: string, setFlappingCallbacks: (setter: (callbacks: IsFlappingCallback[]) => IsFlappingCallback[]) => void }) {
  const [index, setIndex] = useState(Math.floor(Math.random() * FLAP_CHARS.length))
  const targetIndex = Math.max(0, FLAP_CHARS.indexOf(c.toUpperCase()))
  const nextIndex = targetIndex > index ? index + 1 : targetIndex < index ? index - 1 : index
  const isFlapping = index !== targetIndex

  const isFlappingCallback: IsFlappingCallback = useCallback(() => isFlapping, [isFlapping])

  useEffect(() => {
    setFlappingCallbacks(a => [...a, isFlappingCallback])
    return () => {
      setFlappingCallbacks(a => a.filter(c => c !== isFlappingCallback))
    }
  }, [isFlappingCallback, setFlappingCallbacks])

  useEffect(() => {
    const handle = setInterval(() => {
      setIndex(i => targetIndex > i ? i + 1 : targetIndex < i ? i - 1 : i)
    }, FLAP_INTERVAL)

    return () => {
      clearInterval(handle)
    }
  }, [targetIndex])

  const char = index === 0 ? <>&nbsp;</> : FLAP_CHARS[index]
  const nextChar = nextIndex === 0 ? <>&nbsp;</> : FLAP_CHARS[nextIndex]

  return <div className={'Flap' + (index === targetIndex ? '' : ' flipping')}>
    <span>{char}</span>
    <div className='FlapBack'><span>{nextChar}</span></div>
    <div className='FlapTop'><span>{char}</span></div>
    <div className='FlapBottom'><span>{char}</span></div>
  </div>
}

type IsFlappingCallback = () => boolean

function App() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [flappingCallbacks, setFlappingCallbacks] = useState<IsFlappingCallback[]>([])

  useEffect(() => {
    let req: Promise<any[]> | null = null

    const doFetch = async () => {
      if (!req) {
        req = getData()
        const data = await req
        setRows(data)
        req = null
      }
    }

    doFetch()
    const handle = setInterval(() => doFetch(), POLL_INTERVAL)

    return () => {
      clearInterval(handle)
    }
  }, [])

  useEffect(() => {
    let flapCount = flappingCallbacks.filter(c => c()).length
    let isAnyFlapping = flapCount > 0
    if (audioRef.current) {
      audioRef.current.playbackRate = Math.max(0.5, Math.min(4.0, 1.0 + Math.floor(Math.sqrt(flapCount / 2))))
      if (audioRef.current.paused && isAnyFlapping) {
        audioRef.current.play()
      } else if (!audioRef.current.paused && !isAnyFlapping) {
        audioRef.current.pause()
      }
      audioRef.current.loop = isAnyFlapping
    }
  }, [flappingCallbacks])

  return (
    <div className="App">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Bidder</th>
            <th>Bid Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>
            <td><FlapGroup s={prettyPrint(r.itemID)} length={6} align='right' setFlappingCallbacks={setFlappingCallbacks} /></td>
            <td><FlapGroup s={prettyPrint(r.itemName)} length={16} align='left' setFlappingCallbacks={setFlappingCallbacks} /></td>
            <td><FlapGroup s={prettyPrint(r.bidderID)} length={6} align='right' setFlappingCallbacks={setFlappingCallbacks} /></td>
            <td><FlapGroup s={prettyPrint(r.bidAmount)} length={10} align='right' setFlappingCallbacks={setFlappingCallbacks} /></td>
          </tr>)}
        </tbody>
      </table>
      <audio ref={audioRef} src={splitFlapDisplayAudio} />
    </div>
  )
}

function prettyPrint(val: any) {
  if (val === undefined || val === null) return ''
  return String(val)
}

export default App
