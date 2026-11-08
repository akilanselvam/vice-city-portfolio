# Change log

Every change made to this project from 2026-11-08 onward, newest first.

## Ground rules

1. **No `.js` file is ever touched** (created, edited, renamed or deleted) without the owner's explicit
   permission first. Work happens in `.jsx` files (plus CSS, HTML and docs).
2. **Every change is logged here**, in the same session it's made: date, request, files, what changed.

## `.js` baseline

Fingerprints (first 16 characters of SHA-256) of every `.js` file on 2026-11-08. If a fingerprint ever
differs, that file was changed. Check a file in PowerShell with
`(Get-FileHash <file>).Hash.Substring(0,16).ToLower()`.

| File | Fingerprint |
| --- | --- |
| `src/city/generate.js` | `781152e0ea5bae34` |
| `src/city/layout.js` | `a1e847f5ff96d44d` |
| `src/components/icons.js` | `145dd0e9a06e502f` |
| `src/data/portfolio.js` | `69fa52c28240b015` |
| `src/journey/route.js` | `8f547347c3e22ca2` |
| `src/journey/useDriveInput.js` | `e9e9f1ab06d1bae0` |
| `src/journey/useJourney.js` | `71e0b07b58dc8d43` |
| `src/journey/useScrollLock.js` | `bc4f1c9b1809dd4d` |
| `src/theme/fonts.js` | `4953cfc4127c191a` |
| `src/theme/themes.js` | `d8aa59d2901ba0cd` |
| `src/world3d/carCollision.js` | `4fc1d797cee52cc7` |
| `src/world3d/kits.js` | `70bcb5a662ceb6a1` |
| `src/world3d/kits/medievalTextures.js` | `a2fa81a6c7dbfcdf` |
| `src/world3d/kits/spaceTextures.js` | `1b9b6c86fd27922c` |
| `src/world3d/store.js` | `ea14d05f2d15ac71` |
| `src/world3d/textures.js` | `b66cdfc8a2a0c176` |
| `vite.config.js` | `837db25fc33c913b` |

---

## 2026-11-08 — Theme switches use the new loading scenes too

**Request:** refreshing the page showed the new loading screen, but switching themes still showed the old one.

Switching themes shows a separate card (`ThemeTransition`) that still had the old design. It now shows the
same animated scene as the loading screen, for the theme being switched to, with the theme's name above the
loading line ("Galactic · Launching from orbit…"), still revealed in a circle from the theme button.

Because the page is still in the old theme while the card is up, each scene now carries its own theme's
fonts, colours and logo-mark style (on its `ls-<theme>` class) instead of taking them from the page. Checked
all three directions: Neon Bay → Medieval (Cinzel, gold AS), Medieval → Galactic (stencil, yellow AS) and
Galactic → Neon Bay (Anton, pink AS), each while the page was still in the previous theme.

| File | Change |
| --- | --- |
| `src/journey/LoadingScreen.jsx` | Scene split out as `LoadingScene` (with an optional title line) for reuse. |
| `src/journey/ThemeTransition.jsx` | Shows `LoadingScene` for the target theme instead of the old card. |
| `src/index.css` | Old switch-card styles removed; each scene sets its own theme fonts and colours; Medieval and Galactic logo-mark styles and the title line added to the scenes. |
| `src/theme-medieval.css`, `src/theme-space.css` | No longer style the loading logo mark (the scene does). |

No `.js` files touched. Lint and build pass; no console errors.

---

## 2026-11-08 — Pause menu removed; the theme button shows just the three themes

**Request:** remove the pause-menu button in the top-right corner; keep the theme button, showing only the
three themes to switch between.

On phones the ☰ button opened a "Pause menu" drawer (section links, map, free roam and the themes), and on
phones narrower than 520 px the theme button was hidden so the drawer was the only way to switch themes.
Now the ☰ button and drawer are gone, and the theme button shows on every phone width. The phone top bar is
AS · map · free roam · theme; the theme button opens "Choose your world" with just Neon Bay, Medieval and
Galactic. Sections stay reachable on phones through the map, the next-stop button, swiping and the AS
button. Desktop is unchanged (it never had the ☰ button).

| File | Change |
| --- | --- |
| `src/journey/HudBar.jsx` | Removed the ☰ button and the pause-menu drawer. |
| `src/index.css` | Removed the drawer and ☰ styles and the rule hiding the theme button below 520 px. |
| `src/theme-medieval.css`, `src/theme-space.css` | Removed their drawer styles. |

No `.js` files touched. Lint and build pass. Checked on a phone (four top-bar buttons, three themes in the
list, switching works) and on desktop.

---

## 2026-11-08 — Title screen: "Portfolio" no longer overlaps the headline; quip removed

**Request:** the tilted "Portfolio" script overlapped "Senior Software Engineer · Full Stack" in all three
themes; also remove the "Found 0 vulnerabilities…" line.

The script hangs below the name on purpose (negative bottom margin). The old tagline had a top margin to
make room for it, but the headline added later sat directly under the script without that room. The
clearance now belongs to the headline: 22 px in Neon Bay, 48 px in Medieval and Galactic. Measured gap
between the script and the headline afterwards: 3 to 5 px on desktop (1024 wide) and 5 to 13 px on a phone,
in all three themes (it was 5 to 11 px of overlap).

| File | Change |
| --- | --- |
| `src/stops/HomeStop.jsx` | Quip line removed. |
| `src/data/content.jsx` | `quip` removed. |
| `src/index.css` | Headline top margin 22 px; `.home-quip` style removed. |
| `src/theme-medieval.css`, `src/theme-space.css` | The 30 px clearance moved from the tagline to the headline (48 px). |

No `.js` files touched. Lint and build pass. Checked in all three themes on desktop and phone.

---

## 2026-11-08 — Phone layout: compact sections, filters and close button inside, aligned next-stop button

**Request:** on phones the next-stop button was big and misaligned; Projects, Certifications and the other
sections weren't compact (you had to scroll just to understand them); and the buttons at the top of the
sections went outside the card, unreachable and unseen.

Measured on a 375 × 812 phone before the fix: the filter row held 509 px of chips in a 342 px box and
scrolled sideways with no hint (Google, Anthropic, Courses were cut off); the close button hung outside
the card toward the top bar; the next-stop button was 53 px tall and not lined up with the radar.

- **Filters** wrap onto a second line on phones, so every filter is visible and tappable.
- **Close button** sits inside the card's top-right corner.
- **Next-stop button** is a slim single line (about 42 px tall), vertically centred on the radar.
- **Taller panels on the tour:** phones kept 104 px above the radar for the free-roam touch pads even on the
  guided tour; now the tour's panels reach down to just above the radar (free roam keeps the space).
- **Compact sections:** smaller headings, chips, cards and spacing; Certifications cards as tight rows
  (credential IDs cut to one line); Projects with a shorter cover and the description cut to three lines
  (full text in "View mission"); compact About, Experience timeline, Contact list and Free roam stop.

Result: Projects, About, Experience and Contact now fit on one phone screen without scrolling;
Certifications shows the filters plus five certifications before any scrolling (was about two).
Desktop is unchanged (all rules apply only below 760 px).

| File | Change |
| --- | --- |
| `src/phone.css` | **Added.** All phone rules, loaded after the theme files and prefixed with `html[data-theme]` so they apply in all three themes. |
| `src/main.jsx` | Loads `phone.css` last. |
| `src/App.jsx` | Phones on the tour: panels get the height down to the radar (`panelHeight`). |

No `.js` files touched. Lint and build pass. Checked Certifications, Projects, About and Experience (Neon
Bay), Contact (Medieval) and Certifications (Galactic) on a 375 × 812 phone screen, and that desktop is
unaffected.

---

## 2026-11-08 — New animated loading screens for all three themes

**Request:** the initial loading screen looked plain in all three themes; make it eye candy.

The loading screen (shown while the 3D world loads) is now an animated scene per theme, built with CSS
and inline SVG only (no images, nothing extra to download), plus rotating game-style tips
("Tip: Press M to open the map", "Drive into a glowing marker to open a section", …):

- **Neon Bay:** synthwave sunset: a striped retro sun, a skyline with pink and cyan lit windows, twinkling
  stars, a glowing horizon and a neon grid floor rolling towards you, faint scanlines, a flickering neon
  "AS" on the sun and the loading text on the floor.
- **Medieval:** moonlit night: stars, a glowing moon, three layers of mountains, drifting mist and rising
  embers; a gold astrolabe ring slowly turning behind a red-and-gold heraldic shield bearing "AS"; a gold
  progress line and italic script tips.
- **Galactic:** drop-ship HUD: a two-layer drifting starfield, a planet with a glowing atmosphere rim,
  moving hazard-stripe bars top and bottom, corner brackets, a rotating targeting reticle around "AS",
  telemetry lines that type in one by one, and a segmented yellow progress bar.

All animation stops for visitors who ask for reduced motion. Phone layouts are scaled down.

| File | Change |
| --- | --- |
| `src/journey/LoadingScreen.jsx` | **Added.** The three scenes, the emblem (reticle / astrolabe and shield), loading line, progress bar and rotating tips. |
| `src/App.jsx` | Shows `<LoadingScreen />` instead of the old logo, text and bar. |
| `src/index.css` | New loading screen styles (replacing the old ones), phone sizes, reduced-motion rule. |
| `src/theme-medieval.css`, `src/theme-space.css` | Removed the old per-theme loading background, logo size and bar rules. |

No `.js` files touched. Lint and build pass. Checked all three on desktop, and Neon Bay and Galactic on a
phone-sized screen (using a temporary dev-only switch to hold the screen open, since removed).

---

## 2026-11-08 — "Vice City" renamed to "Neon Bay", "VI" logo replaced by "AS", phone panel spacing

**Request:** on phones the section card sat tight against the top bar; move it down a little. Change the
"VI" logo to "AS" and remove the "Vice City" name everywhere (avoid copyright problems).

- The neon theme is now called **Neon Bay** everywhere it shows: theme menu and button, loading screen
  ("Loading Neon Bay…"), theme-switch card, map title, the start stop's name and billboard, the arrival
  name, and the welcome arch at the start of the road ("Neon Bay · Welcome to the sunshine coast").
- The big gradient **"VI"** mark on the title and loading screens is now **"AS"**.
- The page description (search results, link previews) no longer names the game.
- Code comments in `.jsx` / `.css` no longer mention game names.
- Phones: section panels start 16 px lower, so the cards no longer touch the top bar (22 px gap measured).

The old strings still exist, unused, in `src/theme/themes.js` and `src/data/portfolio.js` (`.js`, not edited);
the shown text is overridden in `ThemeContext.jsx`. "Vice City" still appears once inside the built
JavaScript bundle because of those unused strings.

| File | Change |
| --- | --- |
| `src/theme/ThemeContext.jsx` | Neon Bay name, "AS" logo mark, loading text, map title and start-stop name override the old theme text; new `themeCopy(id)` helper. |
| `src/journey/ThemeMenu.jsx`, `ThemeTransition.jsx` | Read theme names through `themeCopy` so they show Neon Bay. |
| `src/world3d/kits/Termini.jsx` | Welcome arch sign says Neon Bay. |
| `index.html` | Page description reworded. |
| `src/index.css` | Phones: panels start 16 px below the top bar. |
| `README.md` | Theme renamed. |
| Comments in `App.jsx`, `MapArt.jsx`, `AreaToast.jsx`, `Radar.jsx`, `Markers.jsx`, `Roadster.jsx`, `ViceGround.jsx`, `PitStops.jsx`, `Realm.jsx`, `Starfield.jsx`, `index.css`, `theme-medieval.css` | Game names removed. |

No `.js` files touched (all 17 fingerprints still match). Lint and build pass. Checked the loading
screen, title screen, theme menu, billboard and arrival name on desktop, and the card spacing on a phone.

---

## 2026-11-08 — Next-stop button after the location name fades

**Request:** at each pit stop, the location name fades in and out in the bottom-right corner (e.g.
"Certifications · Badges earned"). Once it has faded out, fade in a button there that takes the user on to
the next stop, in all three themes.

About 3.6 s after arriving, when the location name fades out, a **Next stop** button fades in at the same
spot: "Drive to Projects" (Vice City), "Ride to Projects" (Medieval), "Fly to Projects" (Galactic), with
the next stop's themed name. Clicking it drives the tour on to the next stop. It fades out as soon as the
vehicle pulls away and comes back after the next arrival. It isn't shown in free roam or at the last stop
(there is no next stop).

Looks: Vice City a neon pill with a pink glow; Medieval a dark panel with a gold border and serif lettering;
Galactic an angular hazard-yellow plate. On phones it sits to the right of the radar.

| File | Change |
| --- | --- |
| `src/journey/AreaToast.jsx` | After the location name fades, shows the next-stop button (`next`, `verb`, `onNext` props). |
| `src/App.jsx` | Passes the next stop, the theme's travel verb and the travel action; tracks when the vehicle has left the stop (`departed`) to hide the button. |
| `src/index.css`, `src/theme-medieval.css`, `src/theme-space.css` | Button styles per theme, smaller on phones. |

No `.js` files touched. Lint and build pass. Checked on the tour (appears after the fade, click drives on,
hidden while driving, reappears at the next stop) in all three themes and on a phone-sized screen.

---

## 2026-11-08 — Free roam stop: Start button right under the title

**Request:** on the last stop, put the Start free roam button right after the title, with the instructions
below it, in all three themes.

The Start free roam / free ride / free flight button now sits directly under the title and subtitle; the
instructor's speech and the how-to list follow below it (side by side on desktop, stacked on phones, where
the button spans the full width).

| File | Change |
| --- | --- |
| `src/stops/FreeRoamStop.jsx` | Button moved from the end of the grid to right after the header. |
| `src/index.css` | Button spacing; the how-to list no longer spans two grid rows; full-width button on phones. |

No `.js` files touched. Lint and build pass. Checked in Vice City, Medieval and Galactic, and on a phone-sized screen.

---

## 2026-11-08 — Real portfolio content, and Skills replaced by Certifications

**Request:** use the old portfolio data (PORTFOLIO_DATA.txt) and the LinkedIn profile (Profile.pdf and the
certifications list), fine-tuned, in this portfolio; replace the Skills section with something more useful.

**Certifications (replaces Skills).** The second stop is now an "achievements unlocked" wall: 7
professional certifications as hexagon badges (gold expert, silver associate, bronze fundamentals, cyan
specialty) with issuer, dates, and a Verify link (Credly) or credential ID; current ones first, AZ-400 and
AZ-204 marked "Expired Oct 2026" and dimmed. Six courses (MongoDB University, Udemy, Zero To Mastery) are
listed underneath. Filters: All / Microsoft / Google / Anthropic / Courses. Named "Badges earned" (Vice
City), "Seals & charters" (Medieval), "Commendations" (Galactic); award icon on the map and marker tag, ★ on
the radar. The cart sign reads "Certifications · 7 earned", its board lists them, and a badge display
board, framed certificate and trophy replace the old workshop props. The tech stack now appears in About.

**Content updated from the old portfolio and LinkedIn**

- Home: "Senior Software Engineer · Full Stack", "Your friendly neighbourhood coder" and the old site's
  quip "Found 0 vulnerabilities, in code and in the heart ;)".
- About: rewritten bio (years of experience counted from Nov 2020, so it stays current), journey / drives /
  beyond-work tabs, MBA mentioned, new Stack row; education shows MBA (HR) and B.Tech (CSE).
- Projects: the four placeholders are replaced by 12 real projects in three groups: Work highlights (AI
  data categorisation with BERT, legacy monolith to microservices), Client websites (Spins Now App, Ravi
  Plumbing Services, Jaanavi Constructions, Life Hack Hub) and Side projects (Let's Tweet Everyone, Find
  Your Dog, Student Info Management, Anime Merch, Farm Store, Natours Tour Booking). Tech tags checked
  against the public GitHub repos. Client and side-project descriptions are short drafts for review.
- Project screenshots copied from the old image host (unreliable: several requests timed out or returned
  503) into `public/images/projects/`; the large Ravi Plumbing image resized to 1200 px. Spins Now uses the
  drawn cover (its only image was a 180 px thumbnail). Covers fall back to the drawn style if an image
  fails to load. Live sites open with "Visit site".
- Experience: Accenture (Senior Software Engineer, Chennai, Apr 2023 – Present), Cognizant (Software
  Engineer FSE, Chennai, Nov 2020 – Apr 2023), MBA HR (Pondicherry University, Jan 2022 – Jan 2024), B.Tech
  CS (Christ College of Engineering and Technology, 2016 – 2020). Place names now show on each entry.
- Contact: real email (selvamakilan1@gmail.com), LinkedIn, GitHub and Instagram, plus a Download CV button.
- Left out as template or unverified data: testimonials, the "zeph1697" sample projects, generic
  "UI/UX / video editing" entries, the "[Your Name]" hero, the incomplete Discord link.

| File | Change |
| --- | --- |
| `src/data/content.jsx` | **Added.** All section content: profile, contact, certifications and courses, projects, experience, plus date helpers. |
| `src/stops/CertificationsStop.jsx` | **Added.** The Certifications section. |
| `src/stops/SkillsStop.jsx` | **Deleted.** |
| `public/images/projects/*.jpg` | **Added.** 9 project screenshots. |
| `src/theme/ThemeContext.jsx` | Shows the second stop (id still `skills`) as Certifications, with a per-theme subtitle. |
| `src/App.jsx` | Uses `CertificationsStop`; reads `profile` from `content.jsx`. |
| `src/stops/HomeStop.jsx`, `AboutStop.jsx`, `ProjectsStop.jsx`, `ExperienceStop.jsx`, `ContactStop.jsx` | Read from `content.jsx`; Home headline and quip, About Stack row, Experience place names, Contact Instagram and Download CV. |
| `src/components/MissionCover.jsx`, `MissionModal.jsx`, `BrandIcons.jsx` | Image fallback and lazy loading; "Visit site"; new Instagram icon. |
| `src/journey/MapOverlay.jsx`, `MarkerLabels.jsx`, `Radar.jsx` | Award icon / ★ for Certifications. |
| `src/world3d/kits/ContentBoard.jsx`, `PitStops.jsx` | Boards and signs read the new content; Certifications board, sign and display props. |
| `src/index.css`, `src/theme-medieval.css`, `src/theme-space.css` | Skills styles replaced by Certifications styles; Home headline and quip; Contact layout. |

No `.js` files touched (all 17 fingerprints still match). `src/data/portfolio.js` still supplies the list of
stops; its old placeholder content is no longer used. Lint and build pass. Checked every section in Vice
City, Certifications in Medieval and on a phone-sized screen.

---

## 2026-11-08 — Vice City street-level detail (no more black ground)

**Request:** in Vice City the land outside the road was black, so the buildings looked like they were
floating in the dark. Add more detail to the city.

The land was one flat, unlit dark-purple surface. Now (Vice City only):

- **Paved ground:** lavender concrete slab paving (4 m slabs with darker joints) over all the land, with
  a faint glow so it reads at night.
- **Sidewalks** along both sides of every road on land (not on bridges), with a pale curb line.
- **Building bases:** every building stands on a plinth 1.5 m wider than its footprint, with a soft pink
  or cyan light pool on the ground around it.
- **Plots in the gaps between buildings** (about 130, placed clear of roads, buildings, stops, carts and
  the shore): lawns with bushes, glowing turquoise swimming pools with white rims, and parking lots with
  painted bays and parked pastel cars.

Everything is instanced (a handful of draw calls); the scenery bundle grew by about 2.7 KB gzipped.

| File | Change |
| --- | --- |
| `src/world3d/ViceGround.jsx` | **Added.** Pavement and parking textures, sidewalks and curbs, plinths and light pools, plot placement, lawns, bushes, pools, lots and parked cars. |
| `src/world3d/City.jsx` | `Ground` takes an optional `landMap` texture (the medieval theme, which also uses `Ground`, is unchanged). The Vice City scene passes the pavement and adds `<ViceGround />`. |

No `.js` files touched (all 17 fingerprints still match). Lint and build pass. Checked on the tour and in
free roam: paving, curbs, plinths and lawns visible; no console errors.

---

## 2026-11-08 — More detail on the medieval cart and the Galactic dropship, and a black-screen fix

**Request:** add detail to the medieval and Galactic vehicles too.

**Medieval horse and cart**

- Horse (also used by the traffic wagons, kept light): tufted mane, a forelock, a bridle with noseband,
  browband and blinkers, a belly band and traces, gold trim under the red saddle pad, a fuller two-part tail.
- Player cart only: plank seams on the sides, iron-capped corner stakes, a bench backrest and footboard,
  iron-banded crates, a hooped barrel, grain sacks, a round red-and-gold heraldic shield on the right
  side, a crimson swallowtail pennant waving on a pole at the back, and a caged iron lantern on a hooked pole.

**Galactic dropship (player ship only; traffic ships unchanged to stay light)**

- Panel seams around the fuselage and armour plates on the flanks
- Canopy frame, twin nose guns and a red sensor eye
- Wingtip fins and red-tipped missile pods under the wings
- Engine pods with intake rings, hazard-striped armour bands and cooling ribs
- Hazard-striped tail-fin cap, an "AS-01" hull number on both sides, a blinking white strobe
- Antenna with a blinking red beacon, and blue hover-jet glows underneath

**Black-screen fix.** While testing, the scene sometimes went fully black after a page load (seen at the
Free roam stop). The tour position could briefly be NaN while the page was still being measured; once
that got into the vehicle's position it never recovered, and the camera, horse gait and ship flight
smoothing kept it too. They now ignore a bad position and reset themselves, and the scene recovered on
its own without a reload when tested.

| File | Change |
| --- | --- |
| `src/world3d/kits/HorseCart.jsx` | Horse detail (shared); `Pennant` (waving canvas flag) and a detailed `PlayerCart`; gait resets if its speed went bad. |
| `src/world3d/kits/Dropship.jsx` | New `ShipDetail` layer (hazard and hull-number canvas textures) on the player ship; flight smoothing resets if it went bad. |
| `src/world3d/Player.jsx` | Keeps the last good scroll position; resets the tour movement and the camera smoothing if any value goes non-finite. |

No `.js` files touched (all 17 fingerprints still match). Lint and build pass. Checked the cart from the
side and rear and the ship from the side up close, plus the normal tour in Medieval.

---

## 2026-11-08 — New Vice City car: faceted 80s neon wedge

**Request:** the Vice City car didn't look nice. Add more detail, sculpt it better, and find a different
approach so it matches the theme.

The satin-grey, smooth GT supercar is replaced by an 80s wedge sports car built from crisp flat panels,
matching the low-poly neon city. Each panel is one flat facet between the shape's keyframes, with extra
slices only around the wheel arches.

- Pearl-lavender paint over a black lower body
- Pink-to-cyan neon side stripe with a thin pinstripe under it, plus twin pinstripes on the bonnet and rear deck
- Pop-up headlights, a neon light line and amber corner lights on the nose
- Raked black glasshouse with a body-colour roof panel and door mirrors
- Black louvers over the rear window, side strakes ahead of the rear wheels, black wheel-arch trims
- Flat 80s rear wing on two stands with a neon trailing edge (keeps the prominent wing)
- Full-width slatted red tail-light bar, plate and twin exhausts
- White turbine-style wheels with eight vents and a glowing pink centre cap
- Pink neon underglow on the road

Same footprint, wheel positions and headlight beam as before, so driving, collisions, the camera and
wheel spin are unchanged. Only the Vice City car changed; the other themes' vehicles and the traffic
cars are the same.

| File | Change |
| --- | --- |
| `src/world3d/Roadster.jsx` | Rewritten: keyframed faceted body loft, glasshouse, neon ribbons, pop-ups, louvers, strakes, wing, tail bar, turbine wheels, underglow. |

No `.js` files touched (all 17 fingerprints still match). Lint and build pass. Checked side, front
three-quarter and rear three-quarter views up close, the normal chase view on the tour, and free roam.

---

## 2026-11-08 — Marker tags only show when you reach that stop

**Request:** the tags above the markers showed from far away, through buildings, even at the first
checkpoint. They should only show when you get there.

The tags are drawn on top of the 3D scene, so before this every stop's tag was visible from anywhere
unless you were standing on it. Now a tag shows only while you're **heading toward** its stop:

- it fades in from 46 map units away and is fully shown by 34 (stops are 52 to 326 apart, so only the
  stop you're driving to qualifies),
- it fades out in the last few units, where the section's popup takes over,
- the stop you're driving away from never shows its tag (it fades out quickly as soon as you move away).

The glowing marker columns themselves are unchanged and still visible from a distance.

| File | Change |
| --- | --- |
| `src/world3d/Markers.jsx` | Tag opacity now depends on distance to its own stop (`LABEL_FAR` 46, `LABEL_FULL` 34) and on whether you're getting closer, smoothed per tag. |

No `.js` files touched (all 17 fingerprints still match). Lint and build pass. Checked on the tour:
nothing shows at the start or when leaving a stop; only the destination's tag fades in and out on arrival.

---

## 2026-11-08 — Pit-stop carts show the real section content

**Request:** the cart names and cart contents had nothing to do with the sections they stand next to.
Correct that.

**Cart signs** now name the section plainly with a real detail underneath, the same words in every theme
(only the lettering is themed). Before, they were themed nicknames such as "Trophy Stand", "Smithy",
"Armory" or "Payphone".

| Stop | Sign title | Sign subtitle |
| --- | --- | --- |
| Home | Welcome | Senior Software Engineer (`profile.role`) |
| About | About Me | Akilan Selvam (`profile.name`) |
| Skills | Skills | Java · Spring · React |
| Projects | Projects | 4 featured builds (count of `projects`) |
| Experience | Experience | Accenture · Cognizant (work entries in `experience`) |
| Contact | Contact | Let's connect |
| Free roam | unchanged: Driving School / Stables / Flight School (they match the top-bar tab) | |

**Back wall of every cart:** the shelves of random coloured jars are replaced by a content board that
shows the section's real data, styled per theme (neon panel, parchment, or holo screen):

| Stop | Board shows |
| --- | --- |
| Home | Name, role and company, the Build · Deploy · Explore · Repeat motto, the tagline |
| About | Role, company, location, education, interests |
| Skills | All 16 skills as a grid |
| Projects | Each project's title and main tech |
| Experience | Each role with company and period |
| Contact | Email, LinkedIn, GitHub, location |
| Free roam | How to play: keys, brake, markers, look around, back to the tour |

**Projects cart notice board:** the six blank coloured cards are now one pinned card per project, with
its title and tech.

All board text is read from `src/data/portfolio.js` (read only, not edited), so it updates when the
portfolio content changes.

| File | Change |
| --- | --- |
| `src/world3d/kits/ContentBoard.jsx` | **Added.** `ContentBoard` (back-wall board per section) and `ProjectCards` (projects notice board), drawn on canvas in each theme's colours and fonts. |
| `src/world3d/kits/PitStops.jsx` | New shared `SIGNS` names used by all three themes (free roam keeps its own). Adds a `ContentBoard` to every cart. Removed the back-wall shelves of goods, and the Skills cart's tool wall (where the board now sits). Projects notice board uses `ProjectCards` instead of blank cards. |

No `.js` files touched (all 17 fingerprints still match). Lint and build pass; checked Skills, Projects
and Experience (Vice City), Contact (Medieval) and About (Galactic).

---

## 2026-11-08 — New marker labels (waypoint tags)

**Request:** the label above each yellow marker (a letter like P or C in a circle, plus the title) didn't
look good. Restyle it.

Each label is now a themed waypoint tag: the section's icon (the same icons the city map uses), its name, a
short subtitle (for example "Featured missions"), and a pointer down to the marker.

| Theme | Look |
| --- | --- |
| Vice City | Neon pill with a pink glow, pink icon disc, bold uppercase name, cyan script subtitle |
| Medieval | Parchment tag with a red wax-seal icon, serif name, italic red subtitle |
| Galactic | Angular HUD waypoint, black with a hazard-yellow edge, yellow icon block, blue subtitle |

| File | Change |
| --- | --- |
| `src/journey/MarkerLabels.jsx` | **Added.** Renders the tags. Keeps the `marker-label` element and `store.labels` hookup that `Markers.jsx` uses to position them. |
| `src/App.jsx` | Uses `<MarkerLabels stops={stops} />` instead of the old inline letter + name markup. Removed the now-unused `store` import. |
| `src/index.css` | Replaced `.marker-letter` / `.marker-name` with `.marker-tag`, `.marker-icon`, `.marker-text`, `.marker-name`, `.marker-sub`, `.marker-pin` (Vice City look). |
| `src/theme-medieval.css` | Replaced the medieval `.marker-letter` rule with the parchment tag styles. |
| `src/theme-space.css` | Replaced the Galactic `.marker-letter` / `.marker-name` rules with the HUD waypoint styles. |

No `.js` files touched (all 17 fingerprints still match). Lint and build pass; checked in all three themes.

---

## 2026-11-08 — Workspace set up

**Request:** make this folder the workspace, install and prepare for development.

| File | Change |
| --- | --- |
| `.claude/launch.json` | **Added.** Preview server entries: `portfolio-dev` (port 5190) and `portfolio-build` (port 5191). Tooling only, not part of the site. |
| `CHANGELOG.md` | **Added.** This file. |
| `node_modules/` | Installed with `npm install` (52 packages, 0 vulnerabilities). Not part of the source. |

No source files changed. Lint and build pass.
