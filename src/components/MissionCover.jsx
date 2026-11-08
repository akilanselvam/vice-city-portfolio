import { useState } from 'react';
import { ICONS } from './icons.js';

export default function MissionCover({ project, size = 'lg' }) {
  const Icon = ICONS[project.icon] ?? ICONS.Rocket;
  const [c1, c2] = project.palette;
  const [failed, setFailed] = useState(null);
  const showImage = project.image && failed !== project.image;
  return (
    <div className={`cover cover-${size}`} style={{ '--c1': c1, '--c2': c2 }}>
      {showImage ? (
        <img src={project.image} alt="" loading="lazy" onError={() => setFailed(project.image)} />
      ) : (
        <>
          <div className="cover-sun" />
          <div className="cover-grid" />
          <Icon className="cover-icon" strokeWidth={1.4} aria-hidden="true" />
        </>
      )}
    </div>
  );
}
