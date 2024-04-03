'use client'

import { useDraw } from '@/hooks/useDraw'
import { drawLine } from '@/utils/drawLine'
import { FC, useEffect, useState } from 'react'
import { CirclePicker } from 'react-color'
import {io} from "socket.io-client"
const socket = io('http://localhost:3001')

interface pageProps {}

type DrawLineProps = {
  color: string
  prevPoint: Point | null
  currentPoint: Point
  lWidth: number
}

const page: FC<pageProps> = ({}) => {

  const [color, setColor] = useState<string>('#000')
  const [lWidth, setlWidth] = useState<number>(5)
  const {canvasRef, onMouseDown, clear} = useDraw(createLine)

  // for text

  const [textFieldValue, setTextFieldValue] = useState('');
  const [submittedItems, setSubmittedItems] = useState<string[]>([]);
  const [word, setWord] = useState('')
  const [unknownLetters, setUnknownLetters] = useState('')
  const [correctGuess, setCorrectGuess] = useState(false)

  const defaultWords = ["jewelry","school","cat","dog","house","car","tree",
  "sun","moon","flower","boat","fish","bird","book","chair","table",
  "hat","ball","star","smile","clock","key","heart","pizza","cupcake",
  "banana","guitar","plane","computer","telephone","elephant","ice cream",
  "soccer","snowman","rainbow","butterfly","horse","robot","clown",
  "dragon","unicorn","superhero","alien","mermaid","pirate","cowboy",
  "vampire","wizard","ninja","astronaut","doctor","teacher"]

  const handleTextFieldChange = (event: any) => {
    setTextFieldValue(event.target.value);
  };

  const handleKeyPress = (event: any) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      // Trigger form submission here
      handleSubmit();
    }
  };

  const handlePlay = () => {
    const length = defaultWords.length
    const random = Math.floor(Math.random() * length)
    setWord(defaultWords[random])
    const temp = word
    setUnknownLetters(temp.replace(/[a-zA-Z]/g, "-"))
    setCorrectGuess(false)
    startTimer(10)
  }

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log('Form submitted with value:', textFieldValue);
    if (textFieldValue === word) {
      setCorrectGuess(true)
    }
    const newItem = textFieldValue.trim()
    if (newItem !== '') {
      setSubmittedItems([...submittedItems, newItem]);
      setTextFieldValue('')
    }
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')

    socket.emit('client-ready')

    socket.on('get-canvas-state', () => {
      if(!canvasRef.current?.toDataURL()) return
      socket.emit('canvas-state', canvasRef.current.toDataURL())
    })

    socket.on('canvas-state-from-server', (state: string) => {
      console.log('received state')
      const img = new Image()
      img.src = state
      img.onload = () => {
        ctx?.drawImage(img, 0, 0)
      }
    })

    socket.on('draw-line', ({ prevPoint, currentPoint, color, lWidth }: DrawLineProps) => {
      if(!ctx) return
      drawLine({ prevPoint, currentPoint, ctx, color, lWidth})
    })

    socket.on('clear', clear)

    return () => {
      socket.off('get-canvas-state')
      socket.off('canvas-state-from-server')
      socket.off('draw-line')
      socket.off('clear')
    }

  }, [])

  function createLine({ prevPoint, currentPoint, ctx }: Draw) {
    socket.emit('draw-line', ({prevPoint, currentPoint, color}))
    drawLine({prevPoint, currentPoint, ctx, color, lWidth})
  }

  const [durationInSeconds, setDurationInSeconds] = useState(10)

  function startTimer(durationInSeconds: number) {
    // let timeLeft = durationInSeconds;
  
    // Update the timer display every second
    const timerInterval = setInterval(() => {
      // Display the remaining time
      console.log(durationInSeconds);
  
      // Decrease the remaining time
      durationInSeconds--;
  
      // If the timer reaches 0, stop the timer
      if (durationInSeconds < 0) {
        clearInterval(timerInterval);
        console.log("Timer has ended!");
      }
    }, 1000); // Interval of 1 second (1000 milliseconds)
  }

  return (
    <div className='w-screen h-screen bg-white flex justify-center items-center'>
      <div className='flex flex-col gap-10 pr-10'>
        <h1 className='text-black'>Draw!</h1>
        <CirclePicker color={color} onChange={(e) => setColor(e.hex)} />
        <div className='flex justify-between'>
          <button type='button' onClick={() => socket.emit('clear')}  className='text-black p-2 rounded-md border border-black hover:bg-gray-100'>Clear</button>
          <button type='button' onClick={() => setColor('#fff')}  className='text-black p-2 rounded-md border border-black hover:bg-gray-100'>Eraser</button>
        </div>
        <div className='flex justify-between text-black items-align-center'>
          <h1>Line Width:</h1>
          <button type='button' onClick={() => setlWidth(lWidth - 1)}  className='text-black p-2 rounded-md border border-black hover:bg-gray-100'>-</button>
          {lWidth}
          <button type='button' onClick={() => setlWidth(lWidth + 1)}  className='text-black p-2 rounded-md border border-black hover:bg-gray-100'>+</button>
        </div>
        <button className='text-black p-2 rounded-md border border-black hover:bg-gray-100' onClick={() => handlePlay()}>Play!</button>
      </div>
      <div className=''>
        <div className='flex justify-between'>
          <h1 className='text-black'>word: {word}, {unknownLetters}</h1>
          <h1 className='text-black'>{durationInSeconds}</h1>
        </div>
        <canvas onMouseDown={onMouseDown} ref={canvasRef} width={500} height={500} className='border border-black rounded-md'/>
      </div>
      <div className='m-6'>
        <form onSubmit={handleSubmit} className='border-black'>
          <input
            type="text"
            id="myTextField"
            name="myTextField"
            className='text-black p-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500'
            value={textFieldValue}
            onChange={handleTextFieldChange}
            onKeyPress={handleKeyPress}
            placeholder='Enter your guess...'
          />
        </form>
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-black">Submitted Items</h2>
          <div className='max-h-48 min-h-12 overflow-y-auto border border-black rounded-md'>
            <ul>
              {submittedItems.map((item, index) => (
                <li key={index} className="mb-2 text-black">{item}</li>
              ))}
            </ul>
          </div>
          {correctGuess ? <p className='text-black'>Correct!</p> : <p></p>}
        </div>
      </div>
    </div>
  )
}

export default page