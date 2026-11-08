import { useTheme } from '../theme/ThemeContext.jsx';

// Section heading; pass `stop` to use that stop's subtitle from the active theme
export default function ScreenHeader({ title, sub, stop, neon = false }) {
  const { stops } = useTheme();
  const subtitle = stop ? stops.find((st) => st.id === stop)?.sub : sub;
  return (
    <header className="screen-head">
      <h1 className={`screen-title display${neon ? ' neon-title' : ''}`}>{title}</h1>
      {subtitle && <p className="screen-sub">{subtitle}</p>}
    </header>
  );
}
