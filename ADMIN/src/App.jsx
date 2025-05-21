import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import './App.css';
import Header from './components/Header';
import Students from './pages/Students/Students';
import Teachers from './pages/Teachers/Teachers';
import Roles from './pages/Roles/Roles';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
    <div className="app-container">
       <Router>
        <Header />
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/roles" element={<Roles />} />
        </Routes>
      </Router>
    </div>
    </>
  );
}

export default App;
