import { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles, ChevronRight, HelpCircle } from 'lucide-react'
import { askCopilot } from '../services/api'
import toast from 'react-hot-toast'

const DEFAULT_SUGGESTIONS = [
  'Why did my expenses increase this month?',
  'Where did I spend the most this month?',
  'Can I afford a ₹50,000 laptop?',
  'How can I save more money?',
  'What are my upcoming bills?',
  'Show my financial health score',
  'Analyze my subscription expenses',
]

const QUICK_CHIPS = [
  'Show transactions',
  'How can I reduce this?',
  'What about last month?',
]

export default function CopilotWidget({ isOpen: propIsOpen, onClose: propOnClose }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof propIsOpen === 'boolean'
  const isOpen = isControlled ? propIsOpen : internalOpen
  const close = () => {
    if (isControlled && propOnClose) propOnClose()
    else setInternalOpen(false)
  }

  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your FinSight AI Copilot. Ask anything about your finances for personalized insights and recommendations based on your real data.',
      chips: QUICK_CHIPS,
    }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (qText) => {
    const q = (qText || question).trim()
    if (!q) return

    const userMsg = { sender: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setQuestion('')
    setLoading(true)

    try {
      const res = await askCopilot(q)
      const botMsg = {
        sender: 'bot',
        text: res.data.answer,
        chips: res.data.suggestedFollowUps && res.data.suggestedFollowUps.length > 0
          ? res.data.suggestedFollowUps
          : QUICK_CHIPS,
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      toast.error('FinSight Copilot temporarily unreachable.')
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'I could not reach the backend financial service. Please check your network and try again.',
          chips: QUICK_CHIPS,
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setInternalOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center gap-2 text-xs font-semibold"
      >
        <Sparkles size={18} className="animate-pulse" />
        <span className="hidden sm:inline">FinSight AI</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0b1021] border border-[#1e2a47] rounded-2xl w-full max-w-4xl h-[620px] max-h-[90vh] shadow-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Header */}
          <div className="p-4 bg-[#080d1a] border-b border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/25">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">FinSight AI Copilot</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">BETA</span>
                </div>
                <p className="text-[11px] text-slate-400">Ask anything about your finances. Get personalized insights and recommendations.</p>
              </div>
            </div>
            <button
              onClick={close}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line text-xs ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-br-sm shadow-md shadow-indigo-600/20'
                      : 'bg-[#111c35] border border-[#1e2a47] text-slate-200 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {m.text}
                </div>

                {/* Quick Chips below bot messages */}
                {m.sender === 'bot' && m.chips && m.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {m.chips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(chip)}
                        className="px-2.5 py-1 rounded-full bg-[#16223d] border border-[#1e2a47] hover:border-indigo-500 text-[11px] text-slate-300 hover:text-indigo-400 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 text-slate-400 text-xs p-3 rounded-xl bg-[#111c35] border border-[#1e2a47] w-fit">
                <Sparkles size={14} className="animate-spin text-indigo-400" />
                <span>FinSight AI is analyzing your financial facts...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="p-3 bg-[#080d1a] border-t border-[#1e293b] flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your finances..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 bg-[#111c35] border border-[#1e2a47] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition disabled:opacity-50 flex items-center justify-center shadow-md shadow-indigo-600/20"
            >
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Suggested Questions Side Column */}
        <div className="w-full md:w-72 bg-[#080d1a] border-t md:border-t-0 md:border-l border-[#1e293b] p-4 flex flex-col justify-between hidden sm:flex shrink-0">
          <div>
            <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs mb-3">
              <HelpCircle size={15} className="text-indigo-400" />
              <span>Suggested Questions</span>
            </div>
            <div className="space-y-1.5">
              {DEFAULT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item)}
                  className="w-full text-left p-2.5 rounded-xl bg-[#111c35]/60 border border-[#1e293b] hover:border-indigo-500/50 hover:bg-[#16223d] text-[11px] text-slate-300 hover:text-indigo-300 transition flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{item}</span>
                  <ChevronRight size={13} className="text-slate-500 group-hover:text-indigo-400 shrink-0 ml-1 transition group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 text-center mt-3">
            FinSight AI queries only your private financial records.
          </p>
        </div>
      </div>
    </div>
  )
}
