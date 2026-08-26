import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  BarChart2, 
  BellRing, 
  FileSpreadsheet, 
  Camera,
  CornerDownLeft
} from 'lucide-react';

const WasteChatbot = ({ setActiveTab, onClearNotifications, stats, user }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.name || 'Officer'}! I am **MEDjestic SmartBot**, your compliance & disposal assistant. Ask me questions about biohazard containment, recycling color bins, or say **"open scanner"** or **"go to reports"** to navigate.`,
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSend(transcript);
        }
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSpeak = (text) => {
    // Strip markdown formatting symbols for speech synthesis
    const cleanText = text.replace(/[*#_\-\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

  // Auto-scroll chat history
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // User message bubble
    const userMsg = { sender: 'user', text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // 1. Navigation Command Interceptor
    const lowerText = text.toLowerCase();
    let navTarget = null;
    let navMsg = '';
    
    if (lowerText.includes('dashboard') || lowerText.includes('home')) {
      navTarget = 'dashboard';
      navMsg = 'Navigating to the Dashboard analytics panel...';
    } else if (lowerText.includes('scan') || lowerText.includes('camera') || lowerText.includes('detect') || lowerText.includes('webcam')) {
      navTarget = 'detection';
      navMsg = 'Opening the AI Waste Detection scanner feed...';
    } else if (lowerText.includes('analytics') || lowerText.includes('chart') || lowerText.includes('graph')) {
      navTarget = 'analytics';
      navMsg = 'Opening Department Analytics & carbon offset comparisons...';
    } else if (lowerText.includes('recommend') || lowerText.includes('protocol') || lowerText.includes('bin') || lowerText.includes('color')) {
      navTarget = 'recommendations';
      navMsg = 'Opening AI Disposal & Recycling color-bin reference manual...';
    } else if (lowerText.includes('report') || lowerText.includes('export') || lowerText.includes('csv') || lowerText.includes('audit')) {
      navTarget = 'reports';
      navMsg = 'Opening Reports Log and Audit Ledger...';
    } else if (lowerText.includes('staff') || lowerText.includes('employee') || lowerText.includes('roster')) {
      navTarget = 'staff';
      navMsg = 'Opening Staff Operations and activity monitor...';
    } else if (lowerText.includes('setting') || lowerText.includes('config') || lowerText.includes('profile')) {
      navTarget = 'settings';
      navMsg = 'Opening settings panel...';
    }

    if (navTarget && setActiveTab) {
      setTimeout(() => {
        setActiveTab(navTarget);
      }, 1000);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `### Action Triggered:\n**${navMsg}**\n\nI have switched your main viewport tab to the requested section. Let me know if you need help with anything else on this page!`,
        time: new Date()
      }]);
      setLoading(false);
      return;
    }

    // 2. Fetch bot reply from Express API
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) throw new Error('API failure');
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: data.reply,
        time: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Sorry, I am having trouble connecting to the brain servers. Please verify the Express backend is running.',
        time: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    setLoading(true);
    if (action === 'stats') {
      const total = stats?.kpis?.totalWaste || 2879.4;
      const rec = stats?.kpis?.recyclableWaste || 1111.4;
      const haz = stats?.kpis?.hazardousWaste || 1212.2;
      const acc = stats?.kpis?.aiAccuracy || 94.2;
      const alerts = stats?.kpis?.activeAlerts || 3;
      
      const statsReply = `### Live Waste Metrics Summary:\n` +
        `- **Total Waste Logged**: **${total} Kg**\n` +
        `- **Recycled / Reclaimed**: **${rec} Kg** (${((rec/total)*100).toFixed(1)}% recovery rate)\n` +
        `- **Hazardous Biohazard Waste**: **${haz} Kg**\n` +
        `- **AI Detector Accuracy**: **${acc}%**\n` +
        `- **Active Section Alerts**: **${alerts} critical warning(s)**\n\n` +
        `*Would you like to export this data to CSV or open the analytics graphs?*`;

      setMessages(prev => [...prev, 
        { sender: 'user', text: 'Get Live Stats Summary', time: new Date() },
        { sender: 'bot', text: statsReply, time: new Date() }
      ]);
      setLoading(false);
    } else if (action === 'clear') {
      setMessages(prev => [...prev, { sender: 'user', text: 'Clear Active Section Alerts', time: new Date() }]);
      try {
        if (onClearNotifications) {
          await onClearNotifications();
        }
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `### Alerts Cleared:\nI have successfully cleared all active notifications and alerts across all hospital departments. Safe statuses are restored!`,
          time: new Date()
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Failed to clear alerts. Please try again.`,
          time: new Date()
        }]);
      } finally {
        setLoading(false);
      }
    } else if (action === 'download') {
      setMessages(prev => [...prev, { sender: 'user', text: 'Export Compliance CSV Report', time: new Date() }]);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/reports/download', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Hospital_Waste_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `### CSV Report Downloaded:\nI have compiled the **compliance ledger spreadsheet** and initiated the download. Please check your browser's download folder!`,
          time: new Date()
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Failed to download CSV report. Is the server online?`,
          time: new Date()
        }]);
      } finally {
        setLoading(false);
      }
    } else if (action === 'scanner') {
      setMessages(prev => [...prev, { sender: 'user', text: 'Launch Waste Scanner', time: new Date() }]);
      if (setActiveTab) {
        setActiveTab('detection');
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `### Scanner Feed Online:\nI have switched your active view to the AI waste detection workspace. Place items under the webcam or select simulated conveyor scan.`,
          time: new Date()
        }]);
      }
      setLoading(false);
    }
  };

  // Convert markdown-style lists/headers to JSX safely
  const formatBotText = (text) => {
    return text.split('\n').map((line, index) => {
      // Headers ###
      if (line.startsWith('### ')) {
        return <h4 key={index} className="font-bold text-slate-800 dark:text-white text-xs uppercase mt-3 mb-1.5">{line.replace('### ', '')}</h4>;
      }
      // Bold **text**
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const matches = [...line.matchAll(boldRegex)];
      
      if (matches.length > 0) {
        return (
          <p key={index} className="leading-relaxed mb-1 text-slate-755 dark:text-slate-200">
            {line.split('**').map((part, idx) => (idx % 2 === 1 ? <strong key={idx} className="font-bold text-blue-600 dark:text-blue-400">{part}</strong> : part))}
          </p>
        );
      }
      
      // Bullets - or *
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const item = line.replace(/^[\-\*]\s+/, '');
        return (
          <li key={index} className="ml-4 list-disc text-slate-655 dark:text-slate-300 mb-1 leading-normal">
            {item.split('**').map((part, idx) => (idx % 2 === 1 ? <strong key={idx} className="font-bold text-slate-800 dark:text-white">{part}</strong> : part))}
          </li>
        );
      }
      
      return <p key={index} className="leading-relaxed mb-1.5 text-slate-650 dark:text-slate-350">{line}</p>;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl h-[580px] flex flex-col justify-between overflow-hidden transition-colors duration-300">
      {/* Bot Chat Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
          <Bot className="w-5.5 h-5.5 animate-pulse-subtle" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
            MEDjestic AI Assistant
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Voice & Operations Command Center</p>
        </div>
      </div>

      {/* Operations Quick Action Panel */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100/75 dark:border-slate-800 flex gap-2 overflow-x-auto select-none no-scrollbar transition-colors">
        <button 
          onClick={() => handleQuickAction('stats')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-full transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
        >
          <BarChart2 className="w-3 h-3 text-blue-500" />
          Get Live Stats
        </button>
        <button 
          onClick={() => handleQuickAction('clear')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-full transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
        >
          <BellRing className="w-3 h-3 text-rose-500" />
          Clear Alerts
        </button>
        <button 
          onClick={() => handleQuickAction('download')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 text-slate-655 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-full transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
        >
          <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
          Export CSV
        </button>
        <button 
          onClick={() => handleQuickAction('scanner')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 text-slate-650 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-full transition-all shrink-0 active:scale-95 shadow-sm cursor-pointer"
        >
          <Camera className="w-3 h-3 text-indigo-500" />
          Open Scanner
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, i) => {
          const isBot = m.sender === 'bot';
          return (
            <div key={i} className={`flex gap-3 max-w-[88%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isBot ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="space-y-1 flex flex-col">
                <div className={`p-3.5 rounded-2xl shadow-soft text-xs leading-relaxed relative ${
                  isBot 
                    ? 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none' 
                    : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                  {isBot ? formatBotText(m.text) : m.text}
                  
                  {/* Speaker Button on bot responses */}
                  {isBot && (
                    <button 
                      onClick={() => handleSpeak(m.text)}
                      className="absolute top-2 right-2 p-1 text-slate-350 hover:text-blue-500 hover:bg-slate-200/30 rounded transition-all active:scale-90 cursor-pointer"
                      title="Speak Text"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${
                  isBot ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500 self-end mr-1'
                }`}>
                  {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 mr-auto max-w-[85%] items-center">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3.5 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Message Area */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-center bg-slate-50/50 dark:bg-slate-950 transition-colors"
      >
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${
            isListening 
              ? 'bg-rose-500 border-rose-600 text-white animate-pulse' 
              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
          }`}
          title={isListening ? "Listening... click to send" : "Voice Input"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask rules, say 'go to scanner'..."
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-550 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors font-sans"
        />
        <button 
          type="submit"
          disabled={loading}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md shrink-0 flex items-center justify-center disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
};

export default WasteChatbot;
