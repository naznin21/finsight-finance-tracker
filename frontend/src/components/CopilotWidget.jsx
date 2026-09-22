import { useState } from 'react'
import { Bot, Send, X, Sparkles, ChevronRight, MessageSquare } from 'lucide-react'
import { askCopilot } from '../services/api'
import toast from 'react-hot-toast'

export default function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your FinSight Financial Copilot. Ask me questions about your spending, budget risks, or purchase decisions.',
      followUps: [
        'Where did most of my money go this month?',
        'Can I afford a ₹60,000 laptop?',
        'Which budget is most at risk?'
      ]
    }
  ])
  const [loading, setLoading] = useState(false)

  const handleSend = async (qText) => {
    const q = qText || question
    if (!q.trim()) return

    const userMsg = { sender: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setQuestion('')
    setLoading(true)

    try {
      const res = await askCopilot(q)
      const botMsg = {
        sender: 'bot',
        text: res.data.answer,
        followUps: res.data.suggestedFollowUps || []
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      toast.error('Copilot service temporarily unavailable.')
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error fetching your backend facts.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-accent to-accentDark text-[#04222b] p-3.5 rounded-full shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-2 font-semibold text-sm group"
        >
          <Bot size={20} className="group-hover:rotate-12 transition-transform" />
          <span>Financial Copilot</span>
        </button>
      )}

      {/* Copilot Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-panel border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px]">
          {/* Header */}
          <div className="p-4 bg-panel2 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-50">FinSight Copilot</h3>
                <p className="text-[10px] text-muted">Grounded Backend Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-slate-200 p-1 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-accent text-[#04222b] font-medium rounded-br-none'
                      : 'bg-panel2 border border-line text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>

                {/* Follow ups */}
                {m.followUps && m.followUps.length > 0 && (
                  <div className="mt-2 space-y-1 w-full">
                    {m.followUps.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="w-full text-left p-2 rounded-lg bg-panel2/60 border border-line/60 hover:border-accent/40 text-[11px] text-slate-300 hover:text-accent transition flex items-center justify-between group"
                      >
                        <span>{f}</span>
                        <ChevronRight size={12} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted text-xs p-2">
                <Sparkles size={14} className="animate-spin text-accent" />
                Analyzing backend financial data...
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend() }}
            className="p-3 bg-panel2 border-t border-line flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask Copilot a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 bg-panel border border-line rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-accent text-[#04222b] px-3 py-2 rounded-lg hover:bg-accentDark transition disabled:opacity-50 flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
