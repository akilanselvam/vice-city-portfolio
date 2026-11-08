import { ChevronRight, Mail, MapPin } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/BrandIcons.jsx';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { contact } from '../data/portfolio.js';

const pretty = (url) => url.replace(/^https?:\/\/(www\.)?/, '');

const ITEMS = [
  { Icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
  { Icon: LinkedinIcon, label: 'LinkedIn', value: pretty(contact.linkedin), href: contact.linkedin, external: true },
  { Icon: GithubIcon, label: 'GitHub', value: pretty(contact.github), href: contact.github, external: true },
  { Icon: MapPin, label: 'Location', value: contact.location },
];

export default function ContactStop() {
  return (
    <div className="contact-stop">
      <div>
        <ScreenHeader title="Contact" stop="contact" />
        <ul className="contact-list">
          {ITEMS.map(({ Icon, label, value, href, external }) => {
            const body = (
              <>
                <span className="info-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="contact-text">
                  <p className="info-label">{label}</p>
                  <p className="info-value">{value}</p>
                </div>
                {href && <ChevronRight className="contact-chevron" size={20} aria-hidden="true" />}
              </>
            );
            return (
              <li key={label}>
                {href ? (
                  <a className="contact-card" href={href} {...(external && { target: '_blank', rel: 'noreferrer' })}>
                    {body}
                  </a>
                ) : (
                  <div className="contact-card">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <p className="script contact-quote" aria-hidden="true">
        New connections,
        <br />
        new destinations
      </p>
    </div>
  );
}
