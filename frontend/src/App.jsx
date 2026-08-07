export default function App() {
  return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Test 1: bare React render</div>;
  import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div style={{ padding: 40 }}>Test 2: with router</div>} />
    </Routes>
  );
}
}
