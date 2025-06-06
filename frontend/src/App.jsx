import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FullUI from './FullUI';
import Overlay from './pages/Overlay';  // Use named import
import { Toaster } from 'react-hot-toast';


function App() {
  return (
    <Router>
      <Toaster position="bottom-end"/>
      <Routes>
        <Route path="/" element={<FullUI />} />
        <Route path="/overlay" element={<Overlay />} />
      </Routes>
    </Router>
  );
}

export default App;
