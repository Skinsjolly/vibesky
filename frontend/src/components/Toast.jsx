import { useState, useEffect, useRef } from 'react';
import { registerToast } from '../lib/utils.jsx';

export default function Toast() {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    registerToast((m) => {
      setMsg(m);
      setShow(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShow(false), 2800);
    });
  }, []);

  return <div className={`toast ${show ? 'show' : ''}`}>{msg}</div>;
}
