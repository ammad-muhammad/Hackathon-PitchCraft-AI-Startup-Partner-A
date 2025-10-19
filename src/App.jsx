import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Dashboard from './Components/Dashboard/Dashboard'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Signup from './Components/Auth/Signup/Signup'
import Login from './Components/Auth/Login/Login'
import SavePitch from './Components/SavePitch/SavePitch'
import { AuthProvider } from './Context/AuthContext'
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  const [count, setCount] = useState(0)

  return (
   <>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

   
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
                
              </ProtectedRoute>
            }
          />
          <Route
            path="/savepitch"
            element={
              <ProtectedRoute>
                <SavePitch />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
   </>
  )
}

export default App
