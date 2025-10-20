import { useEffect, useState } from "react";
import { db } from "../../Firebase";
import { useAuth } from "../../Context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./SavePitch.css";

export default function SavePitch() {
  const { user } = useAuth();
  const [pitches, setPitches] = useState([]);
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [updatedText, setUpdatedText] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "pitches"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setPitches(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleDelete = async (id) => {
    if (confirm("🗑 Are you sure you want to delete this pitch?")) {
      await deleteDoc(doc(db, "pitches", id));
      setSelectedPitch(null);
    }
  };

  const handleUpdate = async (id) => {
    await updateDoc(doc(db, "pitches", id), { response: updatedText });
    setEditingId(null);
    alert("✅ Pitch updated successfully!");
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

  const handleDownloadPDF = (pitch) => {
    try {
      const pitchSections = parsePitchData(pitch.response);
      
      const startupName = pitchSections['Startup Name'] || 'Your Startup';
      const tagline = pitchSections['Tagline'] || 'Your Tagline';
      const elevatorPitch = pitchSections['Elevator Pitch'] || 'Your elevator pitch';
      const problem = pitchSections['Problem'] || 'The problem we solve';
      const solution = pitchSections['Solution'] || 'Our solution';
      const targetAudience = pitchSections['Target Audience'] || 'Target audience';
      const marketSize = pitchSections['Market Size'] || 'Market size';
      const revenueModel = pitchSections['Revenue Model'] || 'Revenue model';

      const docPDF = new jsPDF("p", "pt", "a4");
      const pageWidth = docPDF.internal.pageSize.getWidth();
      const pageHeight = docPDF.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Header
      const drawHeader = () => {
        docPDF.setFillColor(59, 130, 246);
        docPDF.rect(0, 0, pageWidth, 120, "F");
        
        docPDF.setTextColor(255, 255, 255);
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(28);
        docPDF.text(startupName, margin, 60);
        
        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(16);
        docPDF.text(tagline, margin, 85);
        
        // Add decorative element
        docPDF.setDrawColor(255, 255, 255);
        docPDF.setLineWidth(2);
        docPDF.line(margin, 100, margin + 100, 100);
      };

      drawHeader();

      let yPosition = 150;

      const addNewPage = () => {
        docPDF.addPage();
        yPosition = 50;
      };

      // Elevator Pitch Section
      const elevatorLines = docPDF.splitTextToSize(elevatorPitch, contentWidth);
      const elevatorHeight = elevatorLines.length * 15;
      
      docPDF.setFont("helvetica", "bold");
      docPDF.setFontSize(18);
      docPDF.setTextColor(30, 41, 59);
      docPDF.text("Elevator Pitch", margin, yPosition);
      
      docPDF.setFont("helvetica", "normal");
      docPDF.setFontSize(12);
      docPDF.setTextColor(75, 85, 99);
      docPDF.text(elevatorLines, margin, yPosition + 25);
      
      yPosition += elevatorHeight + 50;

      // Problem & Solution Sections
      const problemLines = docPDF.splitTextToSize(problem, contentWidth / 2 - 20);
      const solutionLines = docPDF.splitTextToSize(solution, contentWidth / 2 - 20);

      if (yPosition + 150 > pageHeight - 50) {
        addNewPage();
      }

      // Problem Box
      docPDF.setFillColor(254, 226, 226);
      docPDF.roundedRect(margin, yPosition, contentWidth / 2 - 10, 120, 8, 8, "F");
      docPDF.setDrawColor(252, 165, 165);
      docPDF.roundedRect(margin, yPosition, contentWidth / 2 - 10, 120, 8, 8, "S");
      
      docPDF.setFont("helvetica", "bold");
      docPDF.setFontSize(14);
      docPDF.setTextColor(220, 38, 38);
      docPDF.text("The Problem", margin + 15, yPosition + 25);
      
      docPDF.setFont("helvetica", "normal");
      docPDF.setFontSize(11);
      docPDF.setTextColor(75, 85, 99);
      docPDF.text(problemLines, margin + 15, yPosition + 45);

      // Solution Box
      docPDF.setFillColor(220, 252, 231);
      docPDF.roundedRect(margin + contentWidth / 2 + 10, yPosition, contentWidth / 2 - 10, 120, 8, 8, "F");
      docPDF.setDrawColor(134, 239, 172);
      docPDF.roundedRect(margin + contentWidth / 2 + 10, yPosition, contentWidth / 2 - 10, 120, 8, 8, "S");
      
      docPDF.setFont("helvetica", "bold");
      docPDF.setFontSize(14);
      docPDF.setTextColor(22, 163, 74);
      docPDF.text("Our Solution", margin + contentWidth / 2 + 25, yPosition + 25);
      
      docPDF.setFont("helvetica", "normal");
      docPDF.setFontSize(11);
      docPDF.setTextColor(75, 85, 99);
      docPDF.text(solutionLines, margin + contentWidth / 2 + 25, yPosition + 45);

      yPosition += 150;

      // Target Audience, Market Size, Revenue Model
     const sections = [
  { 
    title: "Target Audience", 
    value: targetAudience, 
    color: [254, 249, 195],
    borderColor: [253, 224, 71],
    textColor: [161, 98, 7]
  },
  { 
    title: "Market Size", 
    value: marketSize, 
    color: [219, 234, 254],
    borderColor: [96, 165, 250],
    textColor: [30, 64, 175]
  },
  { 
    title: "Revenue Model", 
    value: revenueModel, 
    color: [233, 213, 255],
    borderColor: [168, 85, 247],
    textColor: [126, 34, 206]
  }
];

      if (yPosition + 120 > pageHeight - 50) {
        addNewPage();
      }

      const boxWidth = (contentWidth - 20) / 3;
      sections.forEach((section, index) => {
        const xPos = margin + (boxWidth + 10) * index;
        const lines = docPDF.splitTextToSize(section.value, boxWidth - 20);

        docPDF.setFillColor(...section.color);
        docPDF.roundedRect(xPos, yPosition, boxWidth, 100, 6, 6, "F");
        docPDF.setDrawColor(...section.borderColor);
        docPDF.roundedRect(xPos, yPosition, boxWidth, 100, 6, 6, "S");

        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(12);
        docPDF.setTextColor(...section.textColor);
        docPDF.text(section.title, xPos + 10, yPosition + 20);

        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(10);
        docPDF.setTextColor(75, 85, 99);
        docPDF.text(lines, xPos + 10, yPosition + 35);
      });

      yPosition += 130;

      // Footer
      const drawFooter = () => {
        const footerY = pageHeight - 40;
        docPDF.setDrawColor(209, 213, 219);
        docPDF.line(margin, footerY - 20, pageWidth - margin, footerY - 20);
        
        docPDF.setFontSize(10);
        docPDF.setTextColor(107, 114, 128);
        docPDF.setFont("helvetica", "normal");
        
        const userName = user?.displayName || user?.email || "Anonymous User";
        const date = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        
        docPDF.text(`Generated by PitchCraft for ${userName}`, margin, footerY - 5);
        docPDF.text(`Date: ${date}`, pageWidth - margin - 100, footerY - 5);
      };

      const pageCount = docPDF.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docPDF.setPage(i);
        drawFooter();
      }

      const fileName = `${startupName.replace(/[^a-zA-Z0-9]/g, "_")}_Pitch.pdf`;
      docPDF.save(fileName);

    } catch (error) {
      console.error("❌ PDF Generation Error:", error);
      alert("⚠️ Failed to generate PDF. Please try again.");
    }
  };

  const renderStyledPitch = (pitchData) => {
    const sections = parsePitchData(pitchData);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
              <span className="text-xl">🚀</span>
              Startup Name
            </h4>
            <p className="text-2xl font-bold text-blue-900 bg-white/50 rounded-xl p-4 border border-blue-300">
              {sections['Startup Name'] || 'Not specified'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-purple-800 mb-3 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Tagline
            </h4>
            <p className="text-xl font-semibold text-purple-900 bg-white/50 rounded-xl p-4 border border-purple-300 italic">
              "{sections['Tagline'] || 'Not specified'}"
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
          <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
            <span className="text-xl">📈</span>
            Elevator Pitch
          </h4>
          <p className="text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4 border border-green-300">
            {sections['Elevator Pitch'] || 'Not specified'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              Problem
            </h4>
            <p className="text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4 border border-red-300">
              {sections['Problem'] || 'Not specified'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-teal-800 mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Solution
            </h4>
            <p className="text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4 border border-teal-300">
              {sections['Solution'] || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
              <span className="text-xl">👥</span>
              Target Audience
            </h4>
            <p className="text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4 border border-orange-300">
              {sections['Target Audience'] || 'Not specified'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Market Size
            </h4>
            <p className="text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4 border border-indigo-300">
              {sections['Market Size'] || 'Not specified'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-pink-800 mb-3 flex items-center gap-2">
              <span className="text-xl">💰</span>
              Revenue Model
            </h4>
            <p className="text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4 border border-pink-300">
              {sections['Revenue Model'] || 'Not specified'}
            </p>
          </div>
        </div>

        {sections['Landing Page Content'] && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
            <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">🌐</span>
              Landing Page Content
            </h4>
            <div className="text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4 border border-gray-300 whitespace-pre-wrap">
              {sections['Landing Page Content']}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative">
     
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <nav className="w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group hover:scale-105 transition-transform duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <img
                src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
                alt="logo"
                className="w-6 h-6"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PitchCraft
            </h1>
          </Link>
          <Link
            to="/"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            🏠 Dashboard
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 relative z-10 w-full">
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            💼 Saved Pitches
          </h2>
          <p className="text-gray-600">Manage and download your AI-generated startup pitches</p>
        </div>

        {pitches.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-white/80 backdrop-blur-xl p-12 rounded-3xl shadow-2xl border border-white/20 max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">📭</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                No Saved Pitches Yet
              </h3>
              <p className="text-gray-500 mb-8">
                Start creating your first pitch and build something amazing! ✨
              </p>
              <Link
                to="/"
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                ⚡ Create First Pitch
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pitches.map((p) => {
              const name =
                p.response.match(/Startup Name:(.*)/)?.[1]?.trim() ||
                "Unnamed Startup";
              const tagline =
                p.response.match(/Tagline:(.*)/)?.[1]?.trim() || "No tagline";
              
              return (
                <div
                  key={p.id}
                  className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 truncate">
                      {name}
                    </h3>
                    <p className="text-sm text-gray-500 italic line-clamp-2 h-10">
                      {tagline}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedPitch(p)}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      👁 View Details
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setUpdatedText(p.response);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      ✏ Edit Pitch
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(p)}
                      className="w-full py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      📄 Download PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedPitch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl p-8 relative border border-white/20 animate-slideUp max-h-[90vh] overflow-hidden flex flex-col">
           
            <button
              onClick={() => setSelectedPitch(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-red-500 rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all duration-300 group z-10"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">✕</span>
            </button>

            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/5968/5968705.png"
                  className="w-8 h-8"
                  alt="logo"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pitch Details
                </h2>
                <p className="text-sm text-gray-500">
                  👤 {user?.displayName || user?.email}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {renderStyledPitch(selectedPitch.response)}
            </div>

            <div className="flex flex-wrap gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditingId(selectedPitch.id);
                  setUpdatedText(selectedPitch.response);
                  setSelectedPitch(null);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                ✏ Edit
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedPitch)}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                📄 Download
              </button>
              <button
                onClick={() => handleDelete(selectedPitch.id)}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                🗑 Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-4xl p-8 relative border border-white/20 animate-slideUp max-h-[90vh] overflow-hidden flex flex-col">
        
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">✏</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Edit Your Pitch
                </h2>
                <p className="text-sm text-gray-500">Make changes to your pitch content</p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <textarea
                value={updatedText}
                onChange={(e) => setUpdatedText(e.target.value)}
                className="w-full h-full border-2 border-gray-200 rounded-2xl p-6 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 resize-none bg-gradient-to-br from-white to-gray-50 custom-scrollbar font-mono text-sm leading-relaxed"
                placeholder="Edit your pitch content..."
              />
            </div>

            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                onClick={() => handleUpdate(editingId)}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                💾 Save Changes
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}