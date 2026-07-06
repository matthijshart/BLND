# BLEND — Instagram Launch Set v2

12 posts (1080×1350, 4:5) in de actuele huisstijl: wine `#6b1520`, cream `#e8dfd1`,
ink `#1a1817`, blue `#8badc4`, coral-accent. DM Serif Display voor koppen,
JetBrains Mono voor labels — identiek aan bl-nd.nl.

- `posts.html` — alle posts op ware grootte, zelfstandig bestand (fonts embedded).
  Open in de browser om aan te passen; foto's komen uit `/public/images`.
- `png/` — render-klare exports (post 01–12) + `00-grid-preview.png` (zo oogt het profiel).

## Posten

**Volgorde: post 12 eerst, post 01 als laatste.** Instagram toont nieuwste
linksboven — zo staat de grid precies zoals in de preview. Ritme: 3 posts per
week (ma/wo/vr rond 12:00 of 19:00 — lunch- en bankhangpiek), dan is de grid in
4 weken gevuld richting launch.

## Bio

> **BLEND** ☕
> Skip the chat. Meet for real.
> Eén koffie, 60 minuten, wij regelen alles.
> Amsterdam → heel NL · eerste 2 maanden gratis ↓
> bl-nd.nl

## Captions

**01 — logo-hero** *(als laatste posten)*
> Er brouwt iets in Amsterdam. ☕
>
> Geen eindeloos swipen. Geen weken appen. Gewoon koffie, met iemand die de moeite waard is, op een plek die wij uitzoeken.
>
> BLEND. Skip the chat. Meet for real.
>
> #blend #datingapp #amsterdam #koffiedate #nieuw

**02 — first-date-redesigned**
> De eerste date, opnieuw ontworpen: één koffie, zestig minuten, nul small talk vooraf.
>
> Je hoeft niks te plannen, niks te kiezen, niks te overdenken. Alleen komen opdagen.
>
> #blend #eerstedate #koffie #dating #amsterdam

**03 — less-swiping**
> Je weet dat het waar is.
>
> #lessswiping #moresipping #blend #datingfatigue

**04 — the-math**
> 200 matches. 3 ontmoetingen. Ergens gaat er iets mis — en het ligt niet aan jou, het ligt aan de apps.
>
> BLEND fixt de ratio: elke match wordt een date. Automatisch ingepland.
>
> #blend #datingapps #swipen #single #nederland

**05 — how-it-works**
> Vijf stappen. Geen chat. Geen "hey". Geen bar om middernacht.
>
> Om 11:00 vallen de profielen binnen. Jij liket, en als het wederzijds is prikken wij een café tussen jullie buurten in. Vrij–zo, overdag, 60 minuten.
>
> bl-nd.nl
>
> #blend #howitworks #koffiedate #amsterdam

**06 — daytime**
> Andere apps sturen je om 21:00 naar een bar. Wij vinden je interessant genoeg zonder drie glazen chardonnay.
>
> Overdag. Koffie. Gewoon jij.
>
> #blend #koffiedate #terras #daten #amsterdam

**07 — matcha**
> Zeg het maar. 🤷
>
> €8,99 per maand — de eerste 2 maanden gratis via de waitlist. Dat is één matcha.
>
> bl-nd.nl
>
> #blend #matcha #dating #amsterdam #single

**08 — koffie-doen**
> "Leuk! We appen!" — en dan niks, drie maanden lang.
>
> Bij BLEND bestaat "een keer koffie doen" echt: dag, tijd én café staan gewoon in je agenda.
>
> Tag iemand met wie je écht nog koffie moet doen ↓
>
> #wemoetenkoffiedoen #blend #herkenbaar #daten #nederland

**09 — the-standard**
> Twee keer last-minute afzeggen of één keer niet komen opdagen? Account weg. Voorgoed.
>
> Klinkt streng. Is het ook. Daarom komt iedereen op BLEND gewoon opdagen.
>
> #blend #ghosting #noshow #datingstandard

**10 — flat-white**
> Iets om over na te denken tijdens je volgende swipe-sessie op de bank.
>
> #blend #dating #amsterdam #flatwhite #offline

**11 — nederland-next**
> Amsterdam eerst. Daarna? Dat bepaal jij.
>
> De stad met de meeste aanmeldingen op de waitlist is de volgende. Utrecht, Rotterdam, Den Haag, Groningen — laat je horen. 📍
>
> bl-nd.nl — link in bio
>
> #blend #utrecht #rotterdam #denhaag #groningen #nederland

**12 — cta-waitlist** *(als eerste posten)*
> Binnenkort in Amsterdam. Zet je op de waitlist en krijg je eerste 2 maanden gratis.
>
> Link in bio → bl-nd.nl ☕
>
> #blend #comingsoon #waitlist #amsterdam #datingapp

## Hashtag-strategie

Mix per post 3–5 uit deze pools (nooit alle tegelijk, houd het clean):

- **Merk:** #blend #skipthechat #meetforreal #lessswiping
- **NL-bereik:** #daten #single #relatie #herkenbaar #nederland
- **Steden:** #amsterdam #utrecht #rotterdam #denhaag #groningen #020
- **Niche:** #koffiedate #flatwhite #matcha #terras #thirdplace #datingfatigue

## Reels-ideeën (grootste bereik in NL)

1. **"POV: je date is al ingepland"** — telefoon zoemt, agenda-notificatie
   "BLEND ☕ vrijdag 14:00 — Café ___", cut naar deur van het café. Trending audio.
2. **Straatinterviews** ("Hoeveel matches heb je ooit écht ontmoet?") — het
   the-math-concept als video; dit format gaat in NL structureel viral.
3. **"Een keer koffie doen"** — sketch: twee vrienden zeggen het 5× in
   verschillende seizoenen, nooit gebeurt het. Slot: BLEND-notificatie.
4. **Café-tour** — elke week één handpicked BLEND-café (goed licht, goede
   koffie), tag het café voor cross-promo met hun volgers.
5. **Waitlist-race** — maandelijkse counter per stad ("Utrecht 312 vs
   Rotterdam 298"), zet steden tegen elkaar op in de comments.

## Stories (dagelijks ritme)

- 11:00 — "Profiles just dropped" teaser (screenshot-stijl)
- Polls: "Swipen of sippen?", "Welke stad moet volgen?" (sticker)
- Countdown-sticker richting launch
- Herpost van café's en (later) blurred date-fotos met toestemming

## Opnieuw exporteren

```bash
# fonts zitten in posts.html; screenshots via Playwright (zie scripts hieronder)
npx playwright-core # + shot-script: element #post-N → png/NN-naam.png op 1080×1350
```

Of simpel: open `posts.html` in Chrome, en maak per post een schermafbeelding
op 100% zoom (elke `.post` is exact 1080×1350).
