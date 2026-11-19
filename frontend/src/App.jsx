import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import HotelDetail from './pages/HotelDetail'
import RoomDetail from './pages/RoomDetail'
import BookingForm from './pages/BookingForm'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Policies from './pages/Policies'
import Tours from './pages/Tours'
import Restaurants from './pages/Restaurants'
import News from './pages/News'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminHotels from './pages/admin/AdminHotels'
import AdminRooms from './pages/admin/AdminRooms'
import AdminBookings from './pages/admin/AdminBookings'
import AdminEmails from './pages/admin/AdminEmails'
import AdminTours from './pages/admin/AdminTours'
import AdminRestaurants from './pages/admin/AdminRestaurants'
import AdminNews from './pages/admin/AdminNews'
import AdminPartners from './pages/admin/AdminPartners'
import AdminAi from './pages/admin/AdminAi'
import PartnerDashboard from './pages/PartnerDashboard'
import OwnerDashboard from './pages/OwnerDashboard'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route path="/hotels/:hotelId/rooms/:roomId" element={<RoomDetail />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/news" element={<News />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/hotels/:hotelId/rooms/:roomId/book" element={<BookingForm />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/partner" element={<PartnerDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="hotels" element={<AdminHotels />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="partners" element={<AdminPartners />} />
        <Route path="tours" element={<AdminTours />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="news" element={<AdminNews />} />
        <Route path="emails" element={<AdminEmails />} />
        <Route path="ai" element={<AdminAi />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
