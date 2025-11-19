import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- Types ---

interface WidgetDef {
  id: string;
  type: "ai-briefing" | "activity" | "saved" | "stats" | "timer" | "weather";
  title: string;
  colSpan: number; // 1 or 2 (out of a 3-column grid usually, or 4)
}

interface UserData {
  name: string;
  role: string;
  recentActivity: Array<{ id: number; action: string; target: string; time: string; icon: string }>;
  savedItems: Array<{ id: number; title: string; category: string; image: string }>;
  preferences: string[];
}

// --- Mock Data ---

const MOCK_USER: UserData = {
  name: "Alex",
  role: "Creative Director",
  preferences: ["Minimalism", "Tech Trends", "Productivity"],
  recentActivity: [
    { id: 1, action: "Reviewed", target: "Q4 Marketing Plan", time: "2h ago", icon: "description" },
    { id: 2, action: "Liked", target: "Design System v2.0", time: "4h ago", icon: "favorite" },
    { id: 3, action: "Commented on", target: "Team Sync Recording", time: "Yesterday", icon: "comment" },
    { id: 4, action: "Saved", target: "AI UI Patterns 2025", time: "Yesterday", icon: "bookmark" },
    { id: 5, action: "Uploaded", target: "Asset_Bundle_Final.zip", time: "2 days ago", icon: "upload_file" },
  ],
  savedItems: [
    { id: 1, title: "Color Theory in Dark Mode", category: "Design", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80" },
    { id: 2, title: "React 19 Features", category: "Dev", image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80" },
    { id: 3, title: "Leadership Principles", category: "Management", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80" },
  ]
};

const AVAILABLE_WIDGETS: WidgetDef[] = [
  { id: "w-ai", type: "ai-briefing", title: "Daily Briefing", colSpan: 2 },
  { id: "w-stats", type: "stats", title: "Overview", colSpan: 1 },
  { id: "w-activity", type: "activity", title: "Recent Activity", colSpan: 1 },
  { id: "w-saved", type: "saved", title: "Saved For Later", colSpan: 2 },
  { id: "w-timer", type: "timer", title: "Focus Timer", colSpan: 1 },
];

// --- Components ---

const Icon = ({ name, className = "" }: { name: string; className?: string }) => (
  <span className={`material-symbols-rounded select-none ${className}`}>{name}</span>
);

// 1. AI Briefing Widget
const AIBriefingWidget = ({ user }: { user: UserData }) => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBriefing = async () => {
    if (!process.env.API_KEY) {
      setBriefing("API Key not configured. Please set process.env.API_KEY.");
      return;
    }
    
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Generate a short, personalized daily dashboard briefing (max 3 sentences) for ${user.name}, a ${user.role}.
        Recent activity: ${JSON.stringify(user.recentActivity.slice(0, 3))}.
        Preferences: ${user.preferences.join(", ")}.
        Tone: Professional, encouraging, concise.
        Do not use markdown formatting like bold or italics.
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      setBriefing(response.text);
    } catch (err) {
      console.error(err);
      setBriefing("Could not generate briefing at this time.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateBriefing();
  }, []);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Icon name="auto_awesome" className="text-6xl text-purple-400" />
      </div>
      <div className="flex items-center gap-2 mb-3 z-10">
        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg">
           <Icon name="smart_toy" className="text-white text-sm" />
        </div>
        <h3 className="font-semibold text-lg tracking-tight">AI Insight</h3>
      </div>
      
      <div className="flex-1 flex items-center z-10">
        {loading ? (
          <div className="animate-pulse flex flex-col gap-2 w-full">
            <div className="h-3 bg-slate-600/50 rounded w-3/4"></div>
            <div className="h-3 bg-slate-600/50 rounded w-full"></div>
            <div className="h-3 bg-slate-600/50 rounded w-5/6"></div>
          </div>
        ) : (
          <p className="text-slate-300 leading-relaxed text-sm">
            {briefing || "Welcome back! Ready to start your day?"}
          </p>
        )}
      </div>
      
      <button 
        onClick={generateBriefing}
        className="mt-3 text-xs text-purple-400 hover:text-purple-300 self-start flex items-center gap-1 transition-colors z-10"
      >
        <Icon name="refresh" className="text-sm" /> Refresh Insight
      </button>
    </div>
  );
};

// 2. Activity Widget
const ActivityWidget = ({ activities }: { activities: UserData['recentActivity'] }) => (
  <div className="h-full flex flex-col">
    <ul className="space-y-3 custom-scroll overflow-y-auto pr-2 flex-1">
      {activities.map((act) => (
        <li key={act.id} className="flex gap-3 items-start group">
          <div className="mt-1 p-1.5 rounded-full bg-slate-700/50 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
            <Icon name={act.icon} className="text-xs" />
          </div>
          <div>
            <p className="text-sm text-slate-200">
              <span className="text-slate-400">{act.action}</span> {act.target}
            </p>
            <span className="text-xs text-slate-500">{act.time}</span>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

// 3. Saved Items Widget
const SavedItemsWidget = ({ items }: { items: UserData['savedItems'] }) => (
  <div className="h-full">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 h-full">
      {items.map((item) => (
        <div key={item.id} className="group relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 aspect-video sm:aspect-auto">
          <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
            <span className="text-xs text-purple-300 font-medium mb-0.5">{item.category}</span>
            <h4 className="text-sm font-semibold text-white leading-tight">{item.title}</h4>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 4. Stats Widget
const StatsWidget = () => (
  <div className="grid grid-cols-2 gap-3 h-full">
    <div className="bg-slate-800/50 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-700/50">
      <span className="text-3xl font-bold text-blue-400">12</span>
      <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Pending</span>
    </div>
    <div className="bg-slate-800/50 rounded-lg p-3 flex flex-col items-center justify-center border border-slate-700/50">
      <span className="text-3xl font-bold text-emerald-400">85%</span>
      <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Efficiency</span>
    </div>
  </div>
);

// 5. Timer Widget
const TimerWidget = () => {
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isActive && time > 0) {
      interval = window.setInterval(() => setTime((t) => t - 1), 1000);
    } else if (time === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-4xl font-mono font-bold text-slate-100 mb-4 tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            isActive 
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
              : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
          }`}
        >
          {isActive ? "Pause" : "Start"}
        </button>
        <button 
          onClick={() => { setIsActive(false); setTime(25 * 60); }}
          className="px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

// --- Container & App ---

const WidgetContainer = ({ 
  def, 
  children, 
  editMode, 
  onRemove, 
  onMove 
}: { 
  def: WidgetDef; 
  children: React.ReactNode; 
  editMode: boolean;
  onRemove: () => void;
  onMove: (dir: 'left' | 'right') => void;
}) => {
  const colSpanClass = def.colSpan === 2 ? "col-span-1 md:col-span-2" : "col-span-1";
  
  return (
    <div className={`widget-enter group relative flex flex-col ${colSpanClass} min-h-[200px] glass-panel rounded-xl p-5 transition-all duration-300 ${editMode ? 'scale-[0.98] ring-2 ring-blue-500/50 cursor-default bg-slate-800/80' : 'hover:bg-slate-800/40'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-slate-100 font-medium tracking-wide text-sm uppercase opacity-90">{def.title}</h2>
        {editMode && (
            <div className="flex gap-1">
                <button onClick={() => onMove('left')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Icon name="arrow_back" className="text-base" /></button>
                <button onClick={() => onMove('right')} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Icon name="arrow_forward" className="text-base" /></button>
            </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 relative ${editMode ? 'pointer-events-none opacity-50 blur-[1px]' : ''}`}>
        {children}
      </div>

      {/* Edit Mode Controls Overlay */}
      {editMode && (
        <div className="absolute -top-3 -right-3">
          <button 
            onClick={onRemove}
            className="bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-transform hover:scale-110 flex items-center justify-center"
          >
            <Icon name="close" className="text-sm font-bold" />
          </button>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem("dashboard_widgets");
    return saved ? JSON.parse(saved) : ["w-ai", "w-stats", "w-activity", "w-saved", "w-timer"];
  });
  const [editMode, setEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Persist Layout
  useEffect(() => {
    localStorage.setItem("dashboard_widgets", JSON.stringify(activeWidgets));
  }, [activeWidgets]);

  const moveWidget = (index: number, direction: 'left' | 'right') => {
    const newWidgets = [...activeWidgets];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newWidgets.length) {
      [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
      setActiveWidgets(newWidgets);
    }
  };

  const removeWidget = (id: string) => {
    setActiveWidgets(activeWidgets.filter(wId => wId !== id));
  };

  const addWidget = (id: string) => {
    if (!activeWidgets.includes(id)) {
        setActiveWidgets([...activeWidgets, id]);
    }
    setShowAddModal(false);
  };

  // Render Helper
  const renderWidgetContent = (type: string) => {
    switch (type) {
      case "ai-briefing": return <AIBriefingWidget user={MOCK_USER} />;
      case "activity": return <ActivityWidget activities={MOCK_USER.recentActivity} />;
      case "saved": return <SavedItemsWidget items={MOCK_USER.savedItems} />;
      case "stats": return <StatsWidget />;
      case "timer": return <TimerWidget />;
      default: return null;
    }
  };

  const availableToAdd = AVAILABLE_WIDGETS.filter(w => !activeWidgets.includes(w.id));

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                {MOCK_USER.name[0]}
            </div>
            <div>
                <h1 className="font-semibold text-slate-100 text-sm leading-tight">Welcome back, {MOCK_USER.name}</h1>
                <p className="text-xs text-slate-400 leading-tight">Personal Dashboard</p>
            </div>
          </div>
          
          <button 
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${editMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Icon name={editMode ? "check" : "tune"} className="text-lg" />
            {editMode ? "Done" : "Customize"}
          </button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
          {activeWidgets.map((widgetId, index) => {
            const def = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
            if (!def) return null;
            
            return (
              <WidgetContainer 
                key={widgetId} 
                def={def} 
                editMode={editMode}
                onRemove={() => removeWidget(widgetId)}
                onMove={(dir) => moveWidget(index, dir)}
              >
                {renderWidgetContent(def.type)}
              </WidgetContainer>
            );
          })}

          {/* Add Widget Button (Visible only in Edit Mode) */}
          {editMode && availableToAdd.length > 0 && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="col-span-1 min-h-[200px] rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/30 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 transition-all gap-2 group"
            >
              <div className="p-3 rounded-full bg-slate-800 group-hover:bg-blue-500/20 transition-colors">
                <Icon name="add" className="text-2xl" />
              </div>
              <span className="font-medium">Add Widget</span>
            </button>
          )}
        </div>
      </main>

      {/* Add Widget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Add Widget</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                    <Icon name="close" />
                </button>
            </div>
            <div className="p-4 space-y-2">
                {availableToAdd.map(w => (
                    <button 
                        key={w.id}
                        onClick={() => addWidget(w.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left"
                    >
                        <span className="font-medium text-slate-200">{w.title}</span>
                        <Icon name="add_circle" className="text-blue-400" />
                    </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
