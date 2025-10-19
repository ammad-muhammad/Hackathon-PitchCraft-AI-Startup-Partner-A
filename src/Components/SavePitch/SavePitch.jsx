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

  const handleDownloadPDF = (pitch) => {
    try {
      const docPDF = new jsPDF("p", "pt", "a4");
      const pageWidth = docPDF.internal.pageSize.getWidth();
      const pageHeight = docPDF.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Header
      const drawHeader = () => {
        docPDF.setFillColor(33, 150, 243);
        docPDF.rect(0, 0, pageWidth, 100, "F");
        
        const logoUrl = "https://cdn-icons-png.flaticon.com/512/5968/5968705.png";
        docPDF.addImage(logoUrl, "PNG", margin, 20, 45, 45);
        
        docPDF.setTextColor(255, 255, 255);
        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(20);
        docPDF.text("PitchCraft Startup Report", margin + 60, 45);
        
        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(11);
        docPDF.text("AI-powered startup pitch crafted to perfection 🚀", margin + 60, 65);
      };

      drawHeader();

      const cleanText = (text) => {
        return text
          ?.replace(/\*\*/g, "")
          .replace(/\*/g, "")
          .replace(/#+/g, "")
          .trim() || "";
      };

      const response = pitch.response || "";
      
      const extractSection = (label) => {
        const patterns = [
          new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]+\\s*:|$)`, "i"),
          new RegExp(`${label}:\\s*(.+?)(?=\\n[A-Z]|$)`, "i"),
        ];
        
        for (let pattern of patterns) {
          const match = response.match(pattern);
          if (match && match[1]) {
            return cleanText(match[1]);
          }
        }
        return "Not provided";
      };

      const sections = [
        { title: "Startup Name", value: extractSection("Startup Name") },
        { title: "Tagline", value: extractSection("Tagline") },
        { title: "Elevator Pitch", value: extractSection("Elevator Pitch") },
        { title: "Problem", value: extractSection("Problem") },
        { title: "Solution", value: extractSection("Solution") },
        { title: "Target Audience", value: extractSection("Target Audience") },
        { title: "Market Size", value: extractSection("Market Size") },
        { title: "Revenue Model", value: extractSection("Revenue Model") },
        { title: "Landing Page Content", value: extractSection("Landing Page Content") },
      ];

      let yPosition = 130;

      const addNewPage = () => {
        docPDF.addPage();
        drawHeader();
        yPosition = 130;
      };

      sections.forEach((section) => {
        if (!section.value || section.value === "Not provided") return;

        const titleHeight = 25;
        const lines = docPDF.splitTextToSize(section.value, contentWidth - 20);
        const textHeight = lines.length * 15;
        const boxHeight = titleHeight + textHeight + 30;

        if (yPosition + boxHeight > pageHeight - 80) {
          addNewPage();
        }

        docPDF.setFillColor(245, 247, 250);
        docPDF.roundedRect(margin, yPosition, contentWidth, boxHeight, 6, 6, "F");

        docPDF.setDrawColor(220, 220, 220);
        docPDF.setLineWidth(1);
        docPDF.roundedRect(margin, yPosition, contentWidth, boxHeight, 6, 6, "S");

        docPDF.setFont("helvetica", "bold");
        docPDF.setFontSize(13);
        docPDF.setTextColor(33, 33, 33);
        docPDF.text(section.title, margin + 15, yPosition + 20);

        docPDF.setFont("helvetica", "normal");
        docPDF.setFontSize(11);
        docPDF.setTextColor(60, 60, 60);
        docPDF.text(lines, margin + 15, yPosition + 45);

        yPosition += boxHeight + 15;
      });

      const drawFooter = () => {
        const footerY = pageHeight - 50;
        docPDF.setDrawColor(200, 200, 200);
        docPDF.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
        
        docPDF.setFontSize(9);
        docPDF.setTextColor(120, 120, 120);
        docPDF.setFont("helvetica", "normal");
        
        const userName = user?.displayName || user?.email || "Anonymous User";
        const date = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        
        docPDF.text(`Generated for: ${userName}`, margin, footerY);
        docPDF.text(`Date: ${date}`, margin, footerY + 15);
        docPDF.text("© 2025 PitchCraft — AI Startup Builder", pageWidth - margin - 200, footerY);
      };

      const pageCount = docPDF.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docPDF.setPage(i);
        drawFooter();
      }

      const startupName = extractSection("Startup Name");
      const fileName = startupName !== "Not provided" 
        ? `${startupName.replace(/[^a-zA-Z0-9]/g, "_")}_PitchCraft_Report.pdf`
        : "PitchCraft_Pitch_Report.pdf";
      
      docPDF.save(fileName);

    } catch (error) {
      console.error("❌ PDF Generation Error:", error);
      alert("⚠️ Failed to generate PDF. Please try again.");
    }
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
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl p-8 relative border border-white/20 animate-slideUp">
           
            <button
              onClick={() => setSelectedPitch(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-red-500 rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all duration-300 group"
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

         
            <div className="mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border border-blue-100 font-sans leading-relaxed">
                {selectedPitch.response}
              </pre>
            </div>

            <div className="flex flex-wrap gap-3">
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
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl p-8 relative border border-white/20 animate-slideUp">
        
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">✏</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Edit Your Pitch
              </h2>
            </div>

      
            <textarea
              value={updatedText}
              onChange={(e) => setUpdatedText(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-2xl p-4 mb-6 h-80 focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 resize-none bg-gradient-to-br from-white to-gray-50 custom-scrollbar"
              placeholder="Edit your pitch content..."
            />

     
            <div className="flex gap-3">
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