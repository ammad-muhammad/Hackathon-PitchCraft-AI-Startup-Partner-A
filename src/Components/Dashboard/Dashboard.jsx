import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../Firebase";
import { useAuth } from "../../Context/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./Dashboard.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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
Landing Page Content: [compelling content for website]

Make sure each section is on a new line and uses the exact format above.`;

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
      'Startup Name': '',
      'Tagline': '',
      'Elevator Pitch': '',
      'Problem': '',
      'Solution': '',
      'Target Audience': '',
      'Market Size': '',
      'Revenue Model': '',
      'Landing Page Content': ''
    };
    
    const lines = data.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      line = line.trim();
      if (!line) return;
      
      for (const section of Object.keys(sections)) {
        if (line.startsWith(section + ':') || line.startsWith(section + ' :')) {
          currentSection = section;
          const value = line.substring(line.indexOf(':') + 1).trim();
          if (value) {
            sections[currentSection] = value;
          }
          return;
        }
      }
      
      if (currentSection && !line.includes(':')) {
        if (sections[currentSection]) {
          sections[currentSection] += '\n' + line;
        } else {
          sections[currentSection] = line;
        }
      }
    });
    
    return sections;
  };

  const generateLandingPageCode = (pitchSections) => {
    const startupName = pitchSections['Startup Name'] || 'Your Startup';
    const tagline = pitchSections['Tagline'] || 'Your Tagline';
    const elevatorPitch = pitchSections['Elevator Pitch'] || 'Your elevator pitch';
    const problem = pitchSections['Problem'] || 'The problem we solve';
    const solution = pitchSections['Solution'] || 'Our solution';
    const targetAudience = pitchSections['Target Audience'] || 'Target audience';
    const marketSize = pitchSections['Market Size'] || 'Market size';
    const revenueModel = pitchSections['Revenue Model'] || 'Revenue model';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${startupName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-purple-100">
    <nav class="bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"></div>
                    <span class="text-xl font-bold text-gray-900">${startupName}</span>
                </div>
                <div class="hidden md:flex space-x-8">
                    <a href="#problem" class="text-gray-600 hover:text-gray-900 transition-colors">Problem</a>
                    <a href="#solution" class="text-gray-600 hover:text-gray-900 transition-colors">Solution</a>
                    <a href="#audience" class="text-gray-600 hover:text-gray-900 transition-colors">Audience</a>
                    <a href="#market" class="text-gray-600 hover:text-gray-900 transition-colors">Market</a>
                </div>
                <button class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    Get Started
                </button>
            </div>
        </div>
    </nav>

    <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto text-center">
            <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                ${startupName}
            </h1>
            <p class="text-2xl md:text-3xl text-purple-600 font-semibold mb-8">
                ${tagline}
            </p>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                ${elevatorPitch}
            </p>
            <div class="mt-12 space-x-4">
                <button class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                    Start Free Trial
                </button>
                <button class="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-purple-500 hover:text-purple-600 transition-all duration-300">
                    Learn More
                </button>
            </div>
        </div>
    </section>

    <section id="problem" class="py-16 bg-white/50 backdrop-blur-sm">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold text-gray-900 mb-4">The Problem</h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    ${problem}
                </p>
            </div>
        </div>
    </section>

    <section id="solution" class="py-16">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold text-gray-900 mb-4">Our Solution</h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    ${solution}
                </p>
            </div>
        </div>
    </section>

    <section id="audience" class="py-16 bg-white/50 backdrop-blur-sm">
        <div class="max-w-6xl mx-auto px-4">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold text-gray-900 mb-4">Target Audience</h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    ${targetAudience}
                </p>
            </div>
        </div>
    </section>

    <section id="market" class="py-16">
        <div class="max-w-6xl mx-auto px-4">
            <div class="grid md:grid-cols-2 gap-12">
                <div class="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Market Size</h3>
                    <p class="text-gray-600 text-lg leading-relaxed">
                        ${marketSize}
                    </p>
                </div>
                <div class="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                    <h3 class="text-2xl font-bold text-gray-900 mb-4">Revenue Model</h3>
                    <p class="text-gray-600 text-lg leading-relaxed">
                        ${revenueModel}
                    </p>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-6xl mx-auto px-4 text-center">
            <div class="flex justify-center items-center space-x-2 mb-6">
                <div class="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded"></div>
                <span class="text-xl font-bold">${startupName}</span>
            </div>
            <p class="text-gray-400">© 2024 ${startupName}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
  };

  const debugPitchData = (data) => {
    console.log("Raw pitch data:", data);
    const parsed = parsePitchData(data);
    console.log("Parsed sections:", parsed);
    return parsed;
  };

  const pitchSections = pitchData ? debugPitchData(pitchData) : {};

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      {/* Sidebar */}
<aside
  className={`w-72 bg-white/80 backdrop-blur-xl shadow-2xl flex flex-col relative z-10 border-r border-white/20 transform transition-transform duration-300 lg:translate-x-0 ${
    sidebarOpen ? "translate-x-0" : "-translate-x-full"
  } fixed lg:static h-screen lg:h-auto`}
>
  {/* Mobile Close Button */}
  <button
  onClick={() => setSidebarOpen(false)}
  className="absolute top-10 left-4 text-gray-700 hover:text-red-600 text-4xl lg:hidden transition-colors duration-200"
>
  close
</button>
  <div className="px-6 py-8 border-b border-gray-200/50">
    <Link
      to="/"
      className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
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

  <nav className="flex-1 p-4 space-y-2">
    <Link
      to="/"
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
      onClick={() => setSidebarOpen(false)}
    >
      <span className="text-xl">🧠</span>
      <span>Generate Pitch</span>
    </Link>
    <Link
      to="/savepitch"
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/60 text-gray-700 font-medium transition-all duration-300 hover:shadow-md group"
      onClick={() => setSidebarOpen(false)}
    >
      <span className="text-xl group-hover:scale-110 transition-transform">
        💼
      </span>
      <span>Saved Pitches</span>
    </Link>
  </nav>

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
        className="w-full py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
      >
        🚪 Logout
      </button>
    </div>
  )}
</aside>


      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 lg:ml-0">
        {/* Header */}
        <header className="px-4 sm:px-6 lg:px-8 py-4 bg-white/60 backdrop-blur-xl shadow-sm border-b border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
              >
                <span className="text-2xl">☰</span>
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

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 lg:py-8">
          <div className="w-full max-w-6xl">
            {/* Input Section */}
            <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-500 hover:shadow-3xl">
              <div className="text-center mb-6 lg:mb-8">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Generate Your Startup Pitch
                </h3>
                <p className="text-sm sm:text-base text-gray-500">
                  Let AI craft the perfect pitch for your startup idea 🚀
                </p>
              </div>

              <div className="mb-4 sm:mb-6 relative group">
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 resize-none bg-gradient-to-br from-white to-gray-50 group-hover:shadow-lg text-sm sm:text-base"
                  rows="4"
                  placeholder="✍️ Describe your startup idea in detail..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {idea.length} characters
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl lg:rounded-2xl border border-purple-100 gap-3 sm:gap-0">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-lg">🎭</span>
                  Pitch Tone:
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="border-2 border-purple-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-medium cursor-pointer transition-all duration-300 hover:shadow-md text-sm sm:text-base"
                >
                  <option value="formal">🎩 Formal & Professional</option>
                  <option value="fun">🎉 Fun & Creative</option>
                  <option value="technical">🔧 Technical & Detailed</option>
                  <option value="casual">😎 Casual & Friendly</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`flex-1 py-3 sm:py-4 rounded-xl lg:rounded-2xl font-bold text-white shadow-lg transform transition-all duration-300 text-sm sm:text-base ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:shadow-2xl hover:scale-105"
                  }`}
                >
                  {loading ? "Generating..." : "⚡ Generate Pitch"}
                </button>

                {pitchData && (
                  <>
                    <button
                      onClick={handleGenerate}
                      className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl lg:rounded-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                    >
                      🔁 Regenerate
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl lg:rounded-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                    >
                      💾 Save Pitch
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Results Section */}
            {pitchData && (
              <div className="mt-6 lg:mt-8 bg-white/90 backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-2xl lg:rounded-3xl shadow-2xl border border-white/20 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 pb-4 border-b border-gray-200 gap-4 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-xl sm:text-2xl">✨</span>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        Your Generated Pitch
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Ready to impress investors 🎯
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCodePreview(!showCodePreview)}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                  >
                    {showCodePreview ? "📋 Show Pitch" : "👁️ Show Code Preview"}
                  </button>
                </div>

                {!showCodePreview ? (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-blue-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">🚀</span>
                          Startup Name
                        </h4>
                        <p className="text-xl sm:text-2xl font-bold text-blue-900 bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-300">
                          {pitchSections['Startup Name'] || 'Not specified'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-purple-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">🎯</span>
                          Tagline
                        </h4>
                        <p className="text-lg sm:text-xl font-semibold text-purple-900 bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-300 italic">
                          "{pitchSections['Tagline'] || 'Not specified'}"
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                      <h4 className="text-base sm:text-lg font-bold text-green-800 mb-2 sm:mb-3 flex items-center gap-2">
                        <span className="text-lg sm:text-xl">📈</span>
                        Elevator Pitch
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-300 text-sm sm:text-base">
                        {pitchSections['Elevator Pitch'] || 'Not specified'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-red-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">⚠️</span>
                          Problem
                        </h4>
                        <p className="text-gray-700 leading-relaxed bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-300 text-sm sm:text-base">
                          {pitchSections['Problem'] || 'Not specified'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-teal-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">💡</span>
                          Solution
                        </h4>
                        <p className="text-gray-700 leading-relaxed bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-teal-300 text-sm sm:text-base">
                          {pitchSections['Solution'] || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-orange-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">👥</span>
                          Target Audience
                        </h4>
                        <p className="text-gray-700 leading-relaxed bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-orange-300 text-sm sm:text-base">
                          {pitchSections['Target Audience'] || 'Not specified'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-indigo-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">📊</span>
                          Market Size
                        </h4>
                        <p className="text-gray-700 leading-relaxed bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-300 text-sm sm:text-base">
                          {pitchSections['Market Size'] || 'Not specified'}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-pink-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">💰</span>
                          Revenue Model
                        </h4>
                        <p className="text-gray-700 leading-relaxed bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-pink-300 text-sm sm:text-base">
                          {pitchSections['Revenue Model'] || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {pitchSections['Landing Page Content'] && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="text-lg sm:text-xl">🌐</span>
                          Landing Page Content
                        </h4>
                        <div className="text-gray-700 leading-relaxed bg-white/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-300 whitespace-pre-wrap text-sm sm:text-base">
                          {pitchSections['Landing Page Content']}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-xl lg:rounded-2xl p-4 sm:p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
                      <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-lg sm:text-xl">💻</span>
                        Landing Page Code Preview
                      </h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generateLandingPageCode(pitchSections));
                          alert('Code copied to clipboard!');
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                      >
                        📋 Copy Code
                      </button>
                    </div>
                    <pre className="bg-gray-800 rounded-lg sm:rounded-xl p-4 sm:p-6 overflow-x-auto text-green-400 text-xs sm:text-sm leading-relaxed border border-gray-700">
                      <code>{generateLandingPageCode(pitchSections)}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;