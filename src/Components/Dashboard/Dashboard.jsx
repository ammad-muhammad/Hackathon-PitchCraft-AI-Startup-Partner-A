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

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const handleGenerate = async () => {
    if (!idea.trim()) return alert("Please write your startup idea!");
    setLoading(true);
    setPitchData("");

    const prompt = `
You are an AI startup pitch assistant.
Generate a professional startup pitch based on the details below.

Startup Idea: ${idea}
Tone: ${tone}

Return the result clearly formatted like this:

Startup Name:
Tagline:
Elevator Pitch:
Problem:
Solution:
Target Audience:
Market Size:
Revenue Model:
Landing Page Content:
`;

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
     
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

   
      <aside className="w-72 bg-white/80 backdrop-blur-xl shadow-2xl flex flex-col relative z-10 border-r border-white/20">
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
          >
            <span className="text-xl">🧠</span>
            <span>Generate Pitch</span>
          </Link>
          <Link
            to="/savepitch"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/60 text-gray-700 font-medium transition-all duration-300 hover:shadow-md group"
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

     
      <main className="flex-1 flex flex-col relative z-10">
        <header className="px-8 py-5 bg-white/60 backdrop-blur-xl shadow-sm border-b border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Dashboard
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Transform your ideas into perfect pitches ✨
              </p>
            </div>
          </div>
        </header>

       
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-4xl">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-500 hover:shadow-3xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Generate Your Startup Pitch
                </h3>
                <p className="text-gray-500">
                  Let AI craft the perfect pitch for your startup idea 🚀
                </p>
              </div>

              <div className="mb-6 relative group">
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 resize-none bg-gradient-to-br from-white to-gray-50 group-hover:shadow-lg"
                  rows="6"
                  placeholder="✍️ Describe your startup idea in detail..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {idea.length} characters
                </div>
              </div>

              <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl border border-purple-100">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="text-lg">🎭</span>
                  Pitch Tone:
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="border-2 border-purple-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white font-medium cursor-pointer transition-all duration-300 hover:shadow-md"
                >
                  <option value="formal">🎩 Formal & Professional</option>
                  <option value="fun">🎉 Fun & Creative</option>
                  <option value="technical">🔧 Technical & Detailed</option>
                  <option value="casual">😎 Casual & Friendly</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transform transition-all duration-300 ${
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
                      className="flex-1 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      🔁 Regenerate
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    >
                      💾 Save Pitch
                    </button>
                  </>
                )}
              </div>
            </div>

        
            {pitchData && (
              <div className="mt-8 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 animate-fadeIn">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Your Generated Pitch
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ready to impress investors 🎯
                    </p>
                  </div>
                </div>

                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    strong: ({ node, ...props }) => (
                      <strong {...props} className="text-blue-600 font-semibold" />
                    ),
                    p: ({ node, ...props }) => (
                      <p {...props} className="text-gray-700 leading-relaxed mb-3" />
                    ),
                    li: ({ node, ...props }) => (
                      <li {...props} className="ml-6 list-disc text-gray-700 mb-1" />
                    ),
                  }}
                >
                  {pitchData}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
