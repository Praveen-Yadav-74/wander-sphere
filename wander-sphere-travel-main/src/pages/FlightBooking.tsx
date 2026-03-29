/**
 * FlightBooking – Redirects to the new /flights page
 * The old mock-data implementation has been replaced by the full
 * live-data booking engine at /flights.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FlightBooking = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/flights', { replace: true });
  }, [navigate]);
  return null;
};

export default FlightBooking;
