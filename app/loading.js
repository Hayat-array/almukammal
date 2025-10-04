// app/loading.js
import './Loading.css';

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading amazing laptops...</p>
    </div>
  );
}