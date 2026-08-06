import { initial } from '../lib/utils.jsx';

export default function Avatar({ user, size = 40, onClick }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return (
    <div className="avatar" style={style} onClick={onClick}>
      {user?.avatar
        ? <img src={user.avatar} alt={user.name || ''} onError={(e) => { e.target.style.display = 'none'; }} />
        : initial(user?.name)}
    </div>
  );
}
