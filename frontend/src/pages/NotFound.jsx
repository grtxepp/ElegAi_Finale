import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-app flex flex-col items-center justify-center py-28 text-center">
      <div className="font-display text-7xl font-semibold text-gold">404</div>
      <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal">This page is out of style</h1>
      <p className="mt-3 max-w-md text-gray">
        The page you’re looking for doesn’t exist or has moved. Let’s get you back to beautiful things.
      </p>
      <Link to="/" className="btn-gold mt-8">Back to home</Link>
    </div>
  );
}
