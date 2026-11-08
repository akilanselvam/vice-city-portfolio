import { ICONS } from './icons.js';

export default function MissionCover({ project, size = 'lg' }) {
  const Icon = ICONS[project.icon] ?? ICONS.Rocket;
  const [c1, c2] = project.palette;
  return (
    <div className={`cover cover-${size}`} style={{ '--c1': c1, '--c2': c2 }}>
      {project.image ? (
        <img src={project.image} alt="" />
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
