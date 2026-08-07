import { useAuth } from './hooks/useAuth.jsx';

export default function App() {
  const { loading, user } = useAuth();
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      Test 3: loading={String(loading)}, user={user ? 'yes' : 'no'}
    </div>
  );
}
