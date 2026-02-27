import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ProductTree from './components/ProductTree';
import NaiUnitList from './components/NaiUnitList';
import LocationList from './components/LocationList';
import NadUnitList from './components/NadUnitList';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-tree"
              element={
                <ProtectedRoute>
                  <ProductTree />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nai-units"
              element={
                <ProtectedRoute>
                  <NaiUnitList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <LocationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nad-units"
              element={
                <ProtectedRoute>
                  <NadUnitList />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
