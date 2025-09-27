import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRedirect from './components/RoleRedirect';

// Public Shell
import PublicShell from './components/Shells/PublicShell';
import Home from './pages/Public/Home';
import Products from './pages/Public/Products';
import Doctors from './pages/Public/Doctors';
import About from './pages/Public/About';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import RegisterDoctor from './pages/Auth/RegisterDoctor';

// Authenticated Shell
import AuthenticatedShell from './components/Shells/AuthenticatedShell';

// Patient Routes
import PatientDashboard from './pages/Patient/Dashboard';
import PatientAppointments from './pages/Patient/Appointments';
import PatientAppointmentDetail from './pages/Patient/AppointmentDetail';
import BookAppointment from './pages/Patient/BookAppointment';
import HealthTracker from './pages/HealthTracker/HealthTracker';
import PatientEDRC from './pages/Patient/EDRC';
import PatientShop from './pages/Patient/Shop';
import PatientCart from './pages/Patient/Cart';
import PatientOrders from './pages/Patient/Orders';
import PatientProfile from './pages/Patient/Profile';

// Shared Components
import AppointmentPayment from './components/Payment/AppointmentPayment';
import NotificationCenter from './components/Notifications/NotificationCenter';
import AvailabilityManagement from './pages/Doctor/AvailabilityManagement';

// Doctor Routes
import DoctorDashboard from './pages/Doctor/Dashboard';
import DoctorAppointments from './pages/Doctor/Appointments';
import DoctorAppointmentDetail from './pages/Doctor/AppointmentDetail';
import DoctorPatients from './pages/Doctor/Patients';
import DoctorPatientDetail from './pages/Doctor/PatientDetail';
import DoctorEDRC from './pages/Doctor/EDRC';
import DoctorProducts from './pages/Doctor/Products';
import DoctorProfile from './pages/Doctor/Profile';

// Admin Routes
import AdminOverview from './pages/Admin/Overview';
import AdminUsers from './pages/Admin/Users';
import AdminUserDetail from './pages/Admin/UserDetail';
import AdminModeration from './pages/Admin/Moderation';
import AdminAppointments from './pages/Admin/AdminAppointments';
import AdminAppointmentDetail from './pages/Admin/AppointmentDetail';
import AdminCatalog from './pages/Admin/Catalog';
import AdminInventory from './pages/Admin/Inventory';
import AdminOrders from './pages/Admin/Orders';
import AdminOrderDetail from './pages/Admin/OrderDetail';
import AdminAnalytics from './pages/Admin/Analytics';
import AdminSettings from './pages/Admin/Settings';
import AdminProfile from './pages/Admin/Profile';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Forest Green - Wellness & Nature
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#1976D2', // Trust Blue - Technology & Trust
      light: '#42A5F5',
      dark: '#0D47A1',
    },
    success: {
      main: '#4CAF50', // Success Green
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FFC107', // Motivation Yellow
      light: '#FFD54F',
      dark: '#F57C00',
    },
    info: {
      main: '#2196F3', // Info Blue
      light: '#64B5F6',
      dark: '#1976D2',
    },
    error: {
      main: '#F44336', // Error Red
      light: '#EF5350',
      dark: '#D32F2F',
    },
    background: {
      default: '#F8F9FA', // Clarity White with subtle grey
      paper: '#FFFFFF', // Pure White for clarity
    },
    text: {
      primary: '#2E2E2E', // Dark grey for balance
      secondary: '#6B7280', // Medium grey for balance
    },
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '@keyframes float': {
            '0%, 100%': {
              transform: 'translateY(0px)',
            },
            '50%': {
              transform: 'translateY(-20px)',
            },
          },
          '@keyframes pulse': {
            '0%, 100%': {
              transform: 'scale(1)',
            },
            '50%': {
              transform: 'scale(1.05)',
            },
          },
          '@keyframes slideInUp': {
            '0%': {
              transform: 'translateY(30px)',
              opacity: 0,
            },
            '100%': {
              transform: 'translateY(0)',
              opacity: 1,
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicShell />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="about" element={<About />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="register-doctor" element={<RegisterDoctor />} />
            </Route>
            
            {/* Authenticated Routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AuthenticatedShell />
              </ProtectedRoute>
            }>
              {/* Patient Routes */}
              <Route path="patient/dashboard" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="patient/appointments" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientAppointments />
                </ProtectedRoute>
              } />
              <Route path="patient/appointments/book" element={
                <ProtectedRoute requiredRole="patient">
                  <BookAppointment />
                </ProtectedRoute>
              } />
              <Route path="patient/appointments/:id" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientAppointmentDetail />
                </ProtectedRoute>
              } />
              <Route path="appointments/:id/payment" element={
                <ProtectedRoute requiredRole="patient">
                  <AppointmentPayment />
                </ProtectedRoute>
              } />
              <Route path="patient/health" element={
                <ProtectedRoute requiredRole="patient">
                  <HealthTracker />
                </ProtectedRoute>
              } />
              <Route path="patient/edrc" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientEDRC />
                </ProtectedRoute>
              } />
              <Route path="patient/shop" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientShop />
                </ProtectedRoute>
              } />
              <Route path="patient/cart" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientCart />
                </ProtectedRoute>
              } />
              <Route path="patient/orders" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientOrders />
                </ProtectedRoute>
              } />
              <Route path="patient/profile" element={
                <ProtectedRoute requiredRole="patient">
                  <PatientProfile />
                </ProtectedRoute>
              } />
              
              {/* Doctor Routes */}
              <Route path="doctor/dashboard" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="doctor/appointments" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorAppointments />
                </ProtectedRoute>
              } />
              <Route path="doctor/appointments/:id" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorAppointmentDetail />
                </ProtectedRoute>
              } />
              <Route path="doctor/patients" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorPatients />
                </ProtectedRoute>
              } />
              <Route path="doctor/patients/:id" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorPatientDetail />
                </ProtectedRoute>
              } />
              <Route path="doctor/edrc" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorEDRC />
                </ProtectedRoute>
              } />
              <Route path="doctor/products" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorProducts />
                </ProtectedRoute>
              } />
              <Route path="doctor/profile" element={
                <ProtectedRoute requiredRole="doctor">
                  <DoctorProfile />
                </ProtectedRoute>
              } />
              <Route path="doctor/availability" element={
                <ProtectedRoute requiredRole="doctor">
                  <AvailabilityManagement />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="admin/overview" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminOverview />
                </ProtectedRoute>
              } />
              <Route path="admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="admin/users/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUserDetail />
                </ProtectedRoute>
              } />
              <Route path="admin/moderation" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminModeration />
                </ProtectedRoute>
              } />
              <Route path="admin/appointments" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAppointments />
                </ProtectedRoute>
              } />
              <Route path="admin/appointments/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAppointmentDetail />
                </ProtectedRoute>
              } />
              <Route path="admin/catalog" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCatalog />
                </ProtectedRoute>
              } />
              <Route path="admin/inventory" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminInventory />
                </ProtectedRoute>
              } />
              <Route path="admin/orders" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminOrders />
                </ProtectedRoute>
              } />
              <Route path="admin/orders/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminOrderDetail />
                </ProtectedRoute>
              } />
              <Route path="admin/analytics" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminAnalytics />
                </ProtectedRoute>
              } />
              <Route path="admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="admin/profile" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminProfile />
                </ProtectedRoute>
              } />
              
              {/* Shared Routes */}
              <Route path="notifications" element={
                <ProtectedRoute>
                  <NotificationCenter />
                </ProtectedRoute>
              } />
              
              {/* Role-based redirects */}
              <Route path="patient/*" element={<RoleRedirect requiredRole="patient" />} />
              <Route path="doctor/*" element={<RoleRedirect requiredRole="doctor" />} />
              <Route path="admin/*" element={<RoleRedirect requiredRole="admin" />} />
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;