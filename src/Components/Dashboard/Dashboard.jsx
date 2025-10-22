import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../Firebase";
import { useAuth } from "../../Context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [idea, setIdea] = useState("");
  const [tone, setTone] = useState("formal");
  const [loading, setLoading] = useState(false);
  const [pitchData, setPitchData] = useState("");
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const handleGenerate = async () => {
    if (!idea.trim()) return alert("Please write your startup idea!");
    setLoading(true);
    setPitchData("");
    setShowCodePreview(false);

    const prompt = `You are an AI startup pitch assistant.
Generate a professional startup pitch based on the details below.

Startup Idea: ${idea}
Tone: ${tone}

IMPORTANT: Return the result in EXACTLY this format:

Startup Name: [name here]
Tagline: [tagline here]
Elevator Pitch: [2-3 sentence description]
Problem: [the problem being solved]
Solution: [your solution]
Target Audience: [who will use this]
Market Size: [potential market size]
Revenue Model: [how you'll make money]
Landing Page Content: [compelling content for website]`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from Gemini 😔";

      setPitchData(text);
    } catch (err) {
      console.error("❌ Gemini Error:", err);
      alert("Failed to generate pitch! Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return alert("Please login to save your pitch!");
    if (!pitchData) return alert("Generate a pitch first!");

    try {
      await addDoc(collection(db, "pitches"), {
        userId: user.uid,
        idea,
        tone,
        response: pitchData,
        createdAt: serverTimestamp(),
      });
      alert("✅ Pitch saved successfully!");
    } catch (err) {
      console.error("❌ Save Error:", err);
      alert("Failed to save pitch!");
    }
  };

  const parsePitchData = (data) => {
    const sections = {
      "Startup Name": "",
      Tagline: "",
      "Elevator Pitch": "",
      Problem: "",
      Solution: "",
      "Target Audience": "",
      "Market Size": "",
      "Revenue Model": "",
      "Landing Page Content": "",
    };

    const lines = data.split("\n");
    let currentSection = "";

    lines.forEach((line) => {
      line = line.trim();
      if (!line) return;

      for (const section of Object.keys(sections)) {
        if (line.startsWith(section + ":") || line.startsWith(section + " :")) {
          currentSection = section;
          const value = line.substring(line.indexOf(":") + 1).trim();
          if (value) sections[currentSection] = value;
          return;
        }
      }

      if (currentSection && !line.includes(":")) {
        sections[currentSection] += "\n" + line;
      }
    });

    return sections;
  };

  const pitchSections = pitchData ? parsePitchData(pitchData) : {};

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-72 bg-white/80 backdrop-blur-xl shadow-2xl flex flex-col relative z-50 border-r border-white/20 transform transition-transform duration-300 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        fixed lg:translate-x-0 lg:static h-screen`}
      >
        {/* Close Button for Mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-5 left-5 text-gray-700 hover:text-red-600 text-3xl lg:hidden transition-colors duration-200"
        >
          ✖
        </button>

        <div className="px-6 py-8 border-b border-gray-200/50 mt-12 lg:mt-0">
          <Link
            to="/"
            className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <img
                src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
                alt="logo"
                className="w-7 h-7"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PitchCraft
            </h1>
          </Link>
          <p className="text-xs text-gray-500 mt-2 ml-1">AI Startup Builder 🚀</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:scale-105 transition-all"
          >
            🧠 <span>Generate Pitch</span>
          </Link>
          <Link
            to="/savepitch"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/60 text-gray-700 font-medium transition-all"
          >
            💼 <span>Saved Pitches</span>
          </Link>
        </nav>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-gray-200/50 bg-gradient-to-br from-gray-50/50 to-white/50">
            <div className="flex items-center gap-3 mb-3 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:scale-105 transition-all"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 lg:ml-0 ">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 bg-white/60 backdrop-blur-xl shadow-sm border-b border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
              >
                ☰
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Dashboard
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Transform your ideas into perfect pitches ✨
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Input Area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 lg:py-8">
          <div className="w-full max-w-4xl bg-white/90 p-6 rounded-2xl shadow-2xl">
            <h3 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Generate Your Startup Pitch 🚀
            </h3>

            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 resize-none bg-gradient-to-br from-white to-gray-50 text-base"
              rows="4"
              placeholder="✍️ Describe your startup idea..."
            />

            <div className="flex justify-between items-center my-4">
              <label className="font-semibold text-gray-700">Tone:</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-400"
              >
                <option value="formal">🎩 Formal</option>
                <option value="fun">🎉 Fun</option>
                <option value="technical">🔧 Technical</option>
                <option value="casual">😎 Casual</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all duration-300 ${
                  loading
                    ? "bg-gray-400"
                    : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:scale-105"
                }`}
              >
                {loading ? "Generating..." : "⚡ Generate Pitch"}
              </button>

              {pitchData && (
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:scale-105 transition-all"
                >
                  💾 Save Pitch
                </button>
              )}
            </div>

            {/* Pitch Output */}
            {pitchData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-xl font-bold mb-2 text-purple-600">
                  Your Generated Pitch:
                </h4>
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {pitchData}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
