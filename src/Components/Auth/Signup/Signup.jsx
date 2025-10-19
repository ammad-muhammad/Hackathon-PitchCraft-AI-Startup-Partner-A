import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/AuthContext";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { user, signup, loginWithGoogle, loading: authLoading } = useAuth();


  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/");
    } catch (err) {
      console.error("Signup Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleSignup = async () => {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      console.error("Google Signup Error:", err.message);
      setError(err.message);
    }
  };


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative overflow-hidden">

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
            to="/login"
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            Log In
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all hover:shadow-3xl animate-slideUp">
      
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl">✨</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-sm text-gray-500">
              Join PitchCraft and start your AI startup journey 🚀
            </p>
          </div>

      
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl animate-shake">
              <p className="text-red-600 text-sm text-center font-medium">
                ⚠️ {error}
              </p>
            </div>
          )}

      
          <form onSubmit={handleSignup} className="space-y-5">
         
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 focus:outline-none transition-all duration-300 bg-white/80"
              />
            </div>

           
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 focus:outline-none transition-all duration-300 bg-white/80"
              />
            </div>

          
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 focus:outline-none transition-all duration-300 bg-white/80"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-11 text-gray-500 hover:text-purple-600 text-sm font-medium transition-colors"
              >
                {showPassword ? "👁️ Hide" : "👁️‍🗨️ Show"}
              </button>
            </div>

 
            <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 accent-purple-600 cursor-pointer"
              />
              <p className="text-xs text-gray-600 leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-purple-600 font-semibold hover:underline">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-purple-600 font-semibold hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>

  
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-2xl transform hover:scale-105"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                "🎉 Create Account"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

  
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 py-3 rounded-xl hover:bg-white hover:border-purple-300 hover:shadow-lg transition-all duration-300 group bg-white/60"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              className="w-5 h-5 group-hover:scale-110 transition-transform"
            />
            <span className="font-medium text-gray-700 group-hover:text-purple-600 transition-colors">
              Sign up with Google
            </span>
          </button>

   
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:underline"
            >
              Log in here
            </Link>
          </p>
        </div>
      </main>

      <footer className="w-full border-t border-white/20 bg-white/60 backdrop-blur-xl py-4 text-center text-gray-500 text-sm relative z-10">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PitchCraft
          </span>{" "}
          — Built with 💙 for creators
        </p>
      </footer>
    </div>
  );
}