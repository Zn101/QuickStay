import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ChatWidget from './components/ChatWidget'
import { useAuth } from './store/authStore'
import Home from './pages/Home'
import HotelDetail from './pages/HotelDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import BookingPage from './pages/BookingPage'
import History from './pages/History'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function RequireAuth({ role, children }) {
  const user = useAuth((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book/:roomId" element={<RequireAuth role="CUSTOMER"><BookingPage /></RequireAuth>} />
          <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth role="ADMIN"><Admin /></RequireAuth>} />
          <Route path="*" element={<p className="py-20 text-center text-slate-500">Không tìm thấy trang.</p>} />
        </Routes>
      </main>
      <footer className="border-t bg-white py-4 text-center text-xs text-slate-500">
        QuickStay © 2026 – Đặt phòng khách sạn trực tuyến
      </footer>
      <ChatWidget />
    </div>
  )
}
