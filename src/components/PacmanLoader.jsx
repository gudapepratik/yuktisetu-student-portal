import React from 'react';

/**
 * A single pacman travelling left -> right -> left across a row of dots,
 * eating them with his leading edge on each pass and turning around at
 * each end, over an indeterminate progress bar. Used as the loading state
 * for any page waiting on a backend round-trip.
 */
export function PacmanLoader({ label = 'Loading...' }) {
  return (
    <div className="pacman-loader">
      <div className="pacman-track">
        <div className="pacman-dots">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="pacman-dot" />
          ))}
        </div>
        <div className="pacman">
          <span className="pacman-half pacman-top">
            <span className="pacman-eye" />
          </span>
          <span className="pacman-half pacman-bottom" />
        </div>
      </div>
      <div className="pacman-progress-bar" />
      {label && <div className="pacman-label">{label}</div>}
    </div>
  );
}
