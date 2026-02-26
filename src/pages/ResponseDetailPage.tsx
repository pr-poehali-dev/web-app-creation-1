import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ResponseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/order/${id}`, { replace: true });
    } else {
      navigate('/my-orders', { replace: true });
    }
  }, [id, navigate]);

  return null;
}
