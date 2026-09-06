import { Navigate, useParams } from 'react-router-dom';

/** Canonical invite URL is /room/:roomCode — keep /join as an alias. */
export function JoinRedirectPage() {
  const { roomCode = '' } = useParams();
  const code = roomCode.trim().toUpperCase();
  if (!code) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={`/room/${code}`} replace />;
}
