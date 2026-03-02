import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import func2url from '../../backend/func2url.json';

export default function ShortUrlRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!code) { navigate('/'); return; }

    const baseUrl = (func2url as Record<string, string>)['short-url'];
    fetch(`${baseUrl}?code=${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          const url = new URL(data.url);
          if (url.origin === window.location.origin) {
            navigate(url.pathname + url.search, { replace: true });
          } else {
            window.location.href = data.url;
          }
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => navigate('/', { replace: true }));
  }, [code, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-muted-foreground">Переходим...</div>
    </div>
  );
}
