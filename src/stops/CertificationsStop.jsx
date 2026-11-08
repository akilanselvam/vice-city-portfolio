import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { BookOpen, Bot, Cloud, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { certGroups, courses, isExpired, monthYear, sortedCerts } from '../data/content.jsx';

// "Achievements unlocked": professional certifications as badges (tier colour, issuer, dates and a
// Verify link or credential ID), with shorter courses listed underneath

const TIER_LABEL = { expert: 'Expert', associate: 'Associate', fundamentals: 'Fundamentals', specialty: 'Specialty' };
const iconFor = (c) => (c.id === 'gh-copilot' ? Bot : c.group === 'anthropic' ? Sparkles : c.group === 'google' ? Cloud : ShieldCheck);

const CERTS = sortedCerts();
const countFor = (id) => (id === 'all' ? CERTS.length + courses.length : id === 'courses' ? courses.length : CERTS.filter((c) => c.group === id).length);

function CertCard({ cert }) {
  const Icon = iconFor(cert);
  const expired = isExpired(cert);
  return (
    <m.li
      layout
      className={`cert-card tier-${cert.tier}${expired ? ' is-expired' : ''}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.2 }}
    >
      <div className="cert-badge" aria-hidden="true">
        <Icon size={26} strokeWidth={1.8} />
        {cert.code && <span className="cert-code">{cert.code}</span>}
      </div>
      <div className="cert-body">
        <p className="cert-meta">
          {cert.issuer} · {TIER_LABEL[cert.tier]}
        </p>
        <h3 className="cert-name">{cert.name}</h3>
        <p className="cert-dates">
          Issued {monthYear(cert.issued)}
          {cert.expires && (expired ? <span className="cert-expired">Expired {monthYear(cert.expires)}</span> : <> · valid until {monthYear(cert.expires)}</>)}
        </p>
        {cert.url ? (
          <a className="btn cert-verify" href={cert.url} target="_blank" rel="noreferrer">
            Verify <ExternalLink size={14} aria-hidden="true" />
          </a>
        ) : (
          cert.credentialId && (
            <p className="cert-id">
              Credential ID <code>{cert.credentialId}</code>
            </p>
          )
        )}
      </div>
    </m.li>
  );
}

function CourseRow({ course }) {
  const body = (
    <>
      <BookOpen size={16} aria-hidden="true" className="course-icon" />
      <span className="course-name">
        {course.name}
        {course.code && <span className="course-code"> · {course.code}</span>}
      </span>
      <span className="course-issuer">
        {course.issuer}
        {course.year && ` · ${course.year}`}
      </span>
      {course.url && <ExternalLink size={14} aria-hidden="true" className="course-link" />}
    </>
  );
  return (
    <li>
      {course.url ? (
        <a className="course-row" href={course.url} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        <div className="course-row">{body}</div>
      )}
    </li>
  );
}

export default function CertificationsStop() {
  const [group, setGroup] = useState('all');
  const certs = group === 'all' ? CERTS : CERTS.filter((c) => c.group === group);
  const showCourses = group === 'all' || group === 'courses';

  return (
    <div className="certs-stop">
      <div className="stop-top">
        <ScreenHeader title="Certifications" stop="skills" />
        <div className="chip-row" role="group" aria-label="Filter certifications">
          {certGroups.map((g) => (
            <button key={g.id} className={`chip${group === g.id ? ' active' : ''}`} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
              {g.label}
              <span className="chip-count">{countFor(g.id)}</span>
            </button>
          ))}
        </div>
      </div>
      {group !== 'courses' && (
        <>
          <p className="skills-meta" aria-live="polite">
            {certs.filter((c) => !isExpired(c)).length} current · {certs.length} earned
          </p>
          <ul className="cert-grid">
            <AnimatePresence mode="popLayout">
              {certs.map((c) => (
                <CertCard key={c.id} cert={c} />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
      {showCourses && (
        <>
          <p className="skills-meta course-head">Courses</p>
          <ul className="course-list">
            {courses.map((c) => (
              <CourseRow key={c.id} course={c} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
