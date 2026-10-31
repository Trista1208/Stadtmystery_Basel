/* Cleancentive: The Silent Ferry
   An original Basel case. The streets are real. The murder is not. */

const TRASH_TYPES = [
  { id: "butts", label: "Cigarette butts", hint: "The usual Grossbasel confetti" },
  { id: "plastic", label: "Plastic", hint: "Bottles, lids, wrappers" },
  { id: "paper", label: "Paper and cardboard", hint: "Cups, tickets, flyers" },
  { id: "glass", label: "Glass", hint: "Only if you can bag it safely" },
  { id: "metal", label: "Metal", hint: "Cans, caps, foil" },
  { id: "food", label: "Food waste", hint: "Peels, napkins full of crumbs" },
  { id: "other", label: "Other safe litter", hint: "Anything you can lift without risk" },
  { id: "hazard", label: "Hazard — reported, not touched", hint: "Needles, chemicals, batteries, drums" }
];

const SUSPECTS = [
  {
    id: "greta",
    name: "Greta Holz",
    role: "Coffee window at the Fischmarkt",
    blurb: "Elias owed her family mooring money. She has a temper and an early shift."
  },
  {
    id: "kapp",
    name: "Linus Kapp",
    role: "Night chemist, Kleinbasel",
    blurb: "Rents a dye shed opposite the Münster. Stamps his night batches with a K-code."
  },
  {
    id: "nils",
    name: "Nils Frei",
    role: "Scrap hauler",
    blurb: "Knows every barge. Argued with Elias on the bridge two nights ago."
  },
  {
    id: "ida",
    name: "Ida Gerber",
    role: "Guide at the Münster",
    blurb: "Keeps the keys. A pamphlet under the door tries to send you after her."
  }
];

const STOPS = [
  {
    id: "rathaus",
    chapter: "I",
    name: "The Red Court",
    place: "Rathaus, Marktplatz",
    address: "Marktplatz, 4001 Basel",
    lat: 47.55814,
    lng: 7.58785,
    minutesFromPrev: 0,
    walk: "Meet under the scarlet arcade of the Rathaus, on Marktplatz. Tram stops and the market square make this the easiest place to gather a group.",
    scene: `
      <p>Anna Vogt waits under the arcade, a ferry timetable folded into her fist.</p>
      <p>“Elias Brenner was supposed to be here at seven,” she says. “He captains the Münster ferry. He told me he had photographs the canton needed before the morning boats. At dawn they found him on the landing below the Pfalz. The report says he slipped on wet litter.”</p>
      <p>She hands you his notebook. The first page is dry. The rest is Rhine water.</p>
      <blockquote>
        <p>Start where Basel still keeps court. The original front has the pointed arches from the first build. Count those arches. That number opens the case. Trust the façade, not the rumor.</p>
      </blockquote>
      <p>The Rathaus was once called the Richthaus — the court house. Elias never reached it. Someone preferred a dirty landing to a clean statement.</p>
    `,
    plate: "The main Rathaus block went up from 1504 to 1514, after Basel joined the Swiss Confederacy in 1501. That original front has three pointed arches. The tower and the side wing were added later, in 1899–1901. Count only the arches on the old central front.",
    puzzle: {
      type: "text",
      prompt: "How many pointed arches are on the original Rathaus front?",
      placeholder: "A number",
      answers: ["3", "three", "drei"],
      hint: "Ignore the later tower. The old red front is a row of pointed arches — the canton describes three of them."
    },
    success: "Three arches. Anna nods. “Then you are looking at the building, not the gossip. Elias was bringing proof that the litter on the bank was a costume. Someone dressed a crime up as a mess.”",
    evidence: {
      title: "Elias’s first page",
      text: "He was due at the Rathaus at 07:00 with photographs. The original front has three pointed arches. He never arrived. The official line is that he slipped on litter."
    },
    patrol: "Marktplatz collects cups and butts before the city sits down to coffee. Walk the square in front of the Rathaus. Bag what you can carry safely, then log the patrol. The next page stays shut until you do.",
    status: {}
  },
  {
    id: "fischmarkt",
    chapter: "II",
    name: "The Slate",
    place: "Fischmarktbrunnen",
    address: "Fischmarkt, 4051 Basel",
    lat: 47.559254,
    lng: 7.586981,
    minutesFromPrev: 2,
    walk: "With the Rathaus at your back, walk to the north end of Marktplatz. The Fischmarkt fountain is about two minutes away, just before the streets tighten toward the river.",
    scene: `
      <p>Greta Holz runs the coffee window facing the fountain. Her hands are silver with scales and milk.</p>
      <p>“Elias owed my uncle mooring money. I shouted at him on Tuesday. I did not kill him. I was on crates before five. Count them if you don’t believe me.”</p>
      <p>She turns a slate.</p>
      <pre class="slate">FISCHMARKT — GRETA
05:00   IIII
05:20   IIII
05:40   III</pre>
      <p>“The landing is not here,” she says. “If I was counting crates at half past five, I was not on the stairs under the Münster.”</p>
      <p>The fountain beside you is older than the Rathaus front — the Fischmarktbrunnen dates to about 1390. Greta’s temper is older than this morning. The slate is the part you can check.</p>
    `,
    plate: "You are at the Fischmarktbrunnen, a short walk north of the Rathaus. The fountain dates to about 1390. Greta’s slate is in the scene above: two rows of four tally marks and one row of three.",
    puzzle: {
      type: "text",
      prompt: "How many crates does Greta’s slate record?",
      placeholder: "Add the tally",
      answers: ["11", "eleven", "elf"],
      hint: "Add every tally mark. Four, plus four, plus three."
    },
    success: "Eleven crates. The 05:40 line matches the time Elias was found, and this square is a walk from the landing. Greta’s anger is real. Her alibi holds. She stays in the file as a witness.",
    evidence: {
      title: "Greta’s crate slate",
      text: "Eleven crates logged from 05:00 to 05:40 at the Fischmarkt. She was not at the landing when Elias died. Alibi holds."
    },
    patrol: "Fountains gather butts in the basin joints and plastic under the benches. Patrol the Fischmarkt. If the morning sweep already cleared it, say so — a clean spot is a valid log.",
    status: { greta: "cleared" }
  },
  {
    id: "laelle",
    chapter: "III",
    name: "The Tongue",
    place: "Lällekönig, Schifflände",
    address: "Schifflände 1, 4051 Basel",
    lat: 47.55955,
    lng: 7.58815,
    minutesFromPrev: 3,
    walk: "Continue toward the Rhine, to Schifflände 1 at the Grossbasel end of the Mittlere Brücke. The Lällekönig — the crowned head with his tongue out — is on the façade facing the bridge. About three minutes.",
    scene: `
      <p>Grossbasel used to greet Kleinbasel with a tongue. The head on this façade still does it. Lällekönig: tongue-king. The clockwork original lives in the Historisches Museum. This one still minds the crossing.</p>
      <p>A busker who slept in a doorway remembers two men.</p>
      <p>“The scrap man, Frei, and the ferry captain. Frei grabbed Elias by the coat and said, you don’t take those pictures to the red house. Elias laughed and pointed up at the tongue. He said, even the king knows which bank is lying.”</p>
      <blockquote>
        <p>The bridge I can touch was finished in the year the trams needed a wider crossing. Write that year down. The tongue is not decoration. It points at the bank where the drums go in.</p>
      </blockquote>
    `,
    plate: "A bridge has stood on this site since about 1225. The Mittlere Brücke you see was completed in 1905 so trams could cross. The Lällekönig at Schifflände 1 sticks his tongue out across the bridge, toward Kleinbasel.",
    puzzle: {
      type: "text",
      prompt: "In which year was the current Mittlere Brücke completed?",
      placeholder: "Year",
      answers: ["1905"],
      hint: "The medieval crossing was replaced at the start of the twentieth century. The bridge beside you was finished in 1905."
    },
    success: "1905. And the tongue still points at Kleinbasel. Elias was telling the busker where the drums enter the river. Nils Frei tried to stop him reaching the Rathaus. That is pressure. It is not yet a hand on the iron.",
    evidence: {
      title: "Bridge argument",
      text: "Nils Frei confronted Elias at the Lällekönig and tried to keep the photographs away from the Rathaus. The current Mittlere Brücke was completed in 1905. The tongue points at Kleinbasel — the bank Elias accused."
    },
    patrol: "Bridgeheads collect cans, tickets, and the plastic the wind parks against the railing. Patrol Schifflände around the figure. Stay off the tram tracks.",
    status: { nils: "suspicious" }
  },
  {
    id: "ferry",
    chapter: "IV",
    name: "The Landing",
    place: "Münsterfähre «Leu»",
    address: "Oberer Rheinweg, Münster ferry landing",
    lat: 47.55745,
    lng: 7.59235,
    minutesFromPrev: 8,
    walk: "Do not cross the Mittlere Brücke. Turn upstream — the cathedral is on the hill ahead — and follow the Grossbasel riverside path, the Oberer Rheinweg, to the Münster ferry landing. About eight minutes. The boat is the Leu. She has no motor. A cable and the current do the work.",
    scene: `
      <p>This is the place. Wet stone, a coil of rope, the cable singing faintly over the water. Elias Brenner was found on his side. A mooring iron lay in the shallows. Bottles had been arranged around him with more care than a party ever uses.</p>
      <p>Under a flattened bag, a stencil torn in half:</p>
      <pre class="slate">K-1 _</pre>
      <blockquote>
        <p>The Leu has worked this landing since the year they moved her here. The missing digit on the drum is the last digit of that year. Kapp stamps every night batch that way.</p>
      </blockquote>
      <p>The Münster ferry is the old Harzgraben ferry, shifted downstream when the Wettsteinbrücke took her first home. She has been here since that move. Linus Kapp’s night stamp is hiding in that year.</p>
    `,
    plate: "In 1877, when the Wettsteinbrücke was built, the city’s first ferry was moved downstream to the Münster and became the Münsterfähre. The boat on this crossing is the Leu. She is tied to a cable and driven only by the Rhine.",
    puzzle: {
      type: "text",
      prompt: "Complete the drum code. What is the full code?",
      placeholder: "K-…",
      answers: ["k17"],
      hint: "The ferry was moved to this landing in 1877. Take the last digit of that year and finish the stamp K-1."
    },
    success: "K-17. Linus Kapp’s night batch. Elias died holding the code. The bottles were not a celebration. They were laid down so a constable would write “slipped on litter” and close the book.",
    evidence: {
      title: "Drum stencil K-17",
      text: "Recovered under litter at the Münster ferry landing. The missing digit is the last digit of 1877, the year the Leu’s landing was established. K-17 is Linus Kapp’s night-batch stamp."
    },
    patrol: "This is the crime scene in the story, and a real bank in the morning. Lift the safe litter that gathers along the railing and the steps. Do not climb down to the water. If you see a drum, a stain, a needle, or anything chemical, do not touch it — log it as a hazard.",
    status: { kapp: "suspicious" }
  },
  {
    id: "pfalz",
    chapter: "V",
    name: "The Bishop’s View",
    place: "Pfalz",
    address: "Pfalz, behind the Basler Münster",
    lat: 47.55655,
    lng: 7.59285,
    minutesFromPrev: 5,
    walk: "Climb the public stairs from the ferry landing up to the Pfalz, the terrace behind the Münster. About five minutes, and steep. Stay on the steps. If you need a gentler way up, use the public lanes and rejoin the terrace — do not leave the path.",
    scene: `
      <p>Pfalz comes from Palatium: a palace stood near here. The terrace looks over the Rhine, Kleinbasel, and the cable of the ferry you just left. Downstream is the Mittlere Brücke. Upstream, the Wettsteinbrücke.</p>
      <p>A scuff of dark grit marks the parapet, as if someone leaned a lens there. Elias’s notebook, three strokes for a map:</p>
      <blockquote>
        <p>Stood where the bishops stood. The cable of the Leu points at the works. Not Grossbasel. Not the church. The bank the king laughs at.</p>
      </blockquote>
      <p>Anna’s pencil, added this morning: “Kapp Farbwerk rents a shed opposite this terrace. There is no such shed behind the Rathaus. There is nothing up here but stone.”</p>
    `,
    plate: "The Pfalz is the viewing terrace directly behind the Basel Münster, high over the Rhine. The Münster ferry crosses below it, between the Mittlere Brücke (downstream) and the Wettsteinbrücke (upstream). Kleinbasel is the bank across the water — the bank the Lällekönig faces.",
    puzzle: {
      type: "choice",
      prompt: "Where does Elias place Kapp’s dye works?",
      choices: [
        { id: "gross", label: "Grossbasel, behind the Rathaus" },
        { id: "klein", label: "Kleinbasel, the bank across the Rhine" },
        { id: "pfalz", label: "Up here on the Pfalz itself" }
      ],
      correct: "klein",
      hint: "Use the earlier clue. The Lällekönig laughs at Kleinbasel. The cable below you points at that same bank. Anna says the shed is opposite this terrace."
    },
    success: "Kleinbasel. You can see the line without stepping in the river. A man can roll a drum to the current from that bank and be indoors before the Leu swings back. Elias stood here and understood. Then someone asked him to come down.",
    evidence: {
      title: "Sightline from the Pfalz",
      text: "Kapp Farbwerk sits on the Kleinbasel bank, opposite the terrace, on the water the Lällekönig mocks. The landing is directly below. Elias had the view and the photographs."
    },
    patrol: "The terrace is a lookout, so it collects picnic litter along the wall. Patrol the public stones. The view is not going anywhere; the cups are.",
    status: {}
  },
  {
    id: "muenster",
    chapter: "VI",
    name: "A True Year",
    place: "Münsterplatz",
    address: "Münsterplatz, 4051 Basel",
    lat: 47.556516,
    lng: 7.591515,
    minutesFromPrev: 2,
    walk: "Leave the terrace by the public way and come around to Münsterplatz, the square in front of the cathedral. About two minutes. You do not need a ticket. The square is enough, though the church is free to enter when it is open.",
    scene: `
      <p>Red sandstone, patterned tiles, two towers. The Münster was a bishop’s church and is a Protestant one. Ida Gerber is unlocking a side door. Someone has shoved a pamphlet under it.</p>
      <pre class="slate">THE RELIC AND THE WRATH
He died in this church’s city in 1536.
The guilty still kneel where Erasmus lies.
Ask the guide. She keeps the keys.</pre>
      <p>Ida reads it and snorts. “Erasmus does lie inside. He died in Basel in 1536. That pamphlet wants you in the nave, hunting a ghost, while the landing gets hosed down. I open doors. I do not own a dye works. Take the year off the paper and throw the rest away.”</p>
    `,
    plate: "The Basler Münster was built between 1019 and 1500. Erasmus of Rotterdam died in Basel on 12 July 1536 and is buried inside. The pamphlet prints that year to sound holy. You only need the year.",
    puzzle: {
      type: "text",
      prompt: "Which year does the pamphlet use — the year Erasmus died in Basel?",
      placeholder: "Year",
      answers: ["1536"],
      hint: "The pamphlet prints it in the second line. Erasmus died in Basel in 1536."
    },
    success: "1536 is a true year and a false trail. Ida’s mornings are doors and tourists, not drums. Someone who wanted the constable inside the church planted a line from a guidebook. The Münster is clear.",
    evidence: {
      title: "Planted pamphlet",
      text: "Uses 1536, the year Erasmus died in Basel, to send the investigation into the Münster. Ida Gerber is cleared. The leaflet is a delay tactic."
    },
    patrol: "Münsterplatz is broad and windy; paper collects in the corners and along the fountain. Patrol the square. Leave flowers and memorials where they are.",
    status: { ida: "cleared" }
  },
  {
    id: "barfi",
    chapter: "VII",
    name: "The Split",
    place: "Barfüsserplatz",
    address: "Barfüsserplatz, 4051 Basel",
    lat: 47.554588,
    lng: 7.589439,
    minutesFromPrev: 10,
    walk: "Go downhill by the Münsterberg into the lower old town, then continue south to Barfüsserplatz. About ten minutes. It is a tram hub. Stay off the tracks.",
    scene: `
      <p>Barfüsserplatz — Barfi, if you live here — never really closes. A kiosk on the square still has the night log on a clipboard. The owner owes Anna Vogt a favor. She photographed the page before it turned.</p>
      <pre class="slate">05:05  Nils Frei. Coffee.
       Walks off toward the theatre fountain.
05:12  Second man. Dye on the cuff.
       Sweet chemical smell.
       Walks the other way. Toward the Rhine.
05:40  Sirens, far up by the cathedral hill.</pre>
      <p>Nils has been telling anyone who will listen that he was “by the machines,” and that Elias walked with him. The log says they split. Only one of them aimed himself at the landing.</p>
    `,
    plate: "Barfüsserplatz sits below the cathedral hill and links the old town to Theaterplatz. The kiosk log is in your file: 05:05 Nils Frei leaves toward the theatre fountain; 05:12 a second man with dye on his cuff leaves toward the Rhine.",
    puzzle: {
      type: "choice",
      prompt: "Who walked toward the Rhine at 05:12?",
      choices: [
        { id: "greta", label: "Greta Holz" },
        { id: "kapp", label: "Linus Kapp" },
        { id: "nils", label: "Nils Frei" },
        { id: "ida", label: "Ida Gerber" }
      ],
      correct: "kapp",
      hint: "Nils left at 05:05 toward the fountain, away from the river. The second man has dye on his cuff and a chemical smell. That is the night chemist."
    },
    success: "The square splits them. Nils Frei went toward Theaterplatz. Linus Kapp went toward the Rhine, and twenty-eight minutes later Elias was dead. Nils is not innocent. He is also not the man who arrived in time to swing the iron.",
    evidence: {
      title: "Kiosk log, Barfüsserplatz",
      text: "05:05 Nils Frei walks toward the theatre fountain. 05:12 Linus Kapp, dye on the cuff, walks toward the Rhine. Sirens at 05:40 by the cathedral hill."
    },
    patrol: "This is one of the busiest squares in the city, and it shows. Patrol the edges, the benches, and the rims of the bins — not the tracks. Gloves on.",
    status: { kapp: "suspicious", nils: "suspicious" }
  },
  {
    id: "tinguely",
    chapter: "VIII",
    name: "The Troupe",
    place: "Tinguely Fountain",
    address: "Theaterplatz, Fasnachtsbrunnen",
    lat: 47.552849,
    lng: 7.591492,
    minutesFromPrev: 4,
    walk: "From Barfüsserplatz, take Steinenberg toward Theater Basel. The Tinguely Fountain — the Fasnachtsbrunnen — is the black iron troupe in the pool on Theaterplatz. About four minutes.",
    scene: `
      <p>The pool is scrap that learned to dance. Jean Tinguely built the figures from iron, on the footprint of the old theatre stage. Migros gave the fountain to the city. Water argues with metal, and children argue about which machine is the best.</p>
      <p>Nils Frei told the constable a bedtime story: he sat on the rim until sunrise, counting the figures, and there are nine.</p>
      <blockquote>
        <p>Nine was the old troupe. They added the piper later. A man who watched this fountain until dawn would not say nine. Frei learned the number from a poster and went to move the boat.</p>
      </blockquote>
      <p>Elias hated a lazy lie. He had already written the correction on the last dry page.</p>
    `,
    plate: "The Fasnachtsbrunnen was made from 1975 to 1977 and unveiled in 1977, a gift from Migros on its 50th anniversary. It stands where the old city theatre stage was demolished. Nine iron figures came first. A tenth, the piper, was added in 1983.",
    puzzle: {
      type: "text",
      prompt: "How many figures are in the fountain?",
      placeholder: "A number",
      answers: ["10", "ten", "zehn"],
      hint: "Unveiled in 1977 with nine figures. The piper joined in 1983. A true dawn count is ten."
    },
    success: "Ten. Nils recited a fountain that has been wrong since 1983. He was not on this rim at dawn. He was on the water, shifting drum K-17 after his partner finished the worse job. The scrap in this pool is art. The scrap on the landing was a disguise.",
    evidence: {
      title: "A nine-figure alibi",
      text: "The Fasnachtsbrunnen has ten figures: nine from 1977, plus the piper from 1983. Nils Frei said nine. He did not watch the fountain until sunrise. He moved the drums."
    },
    patrol: "Theaterplatz is the last patrol. The fountain is art — do not fish anything out of the basin. Clear the rim, the benches, and the paths around it. Then come back and close the case.",
    status: { nils: "suspicious", kapp: "suspicious" }
  }
];

const ACCUSATION = {
  killer: {
    prompt: "Who struck Elias Brenner on the landing?",
    correct: "kapp",
    choices: ["greta", "kapp", "nils", "ida"]
  },
  accomplice: {
    prompt: "Who moved the drums, and lied about counting the fountain?",
    correct: "nils",
    choices: ["greta", "kapp", "nils", "ida"]
  },
  motive: {
    prompt: "Why was the litter scattered around the body?",
    correct: "costume",
    choices: [
      { id: "party", label: "Elias had been at a party on the landing" },
      { id: "costume", label: "To make a murder look like a slip, and to hide chemical drums under ordinary trash" },
      { id: "minster", label: "The Münster staff dumps the church bins there every morning" }
    ]
  }
};

const VERDICT = {
  title: "The costume comes off",
  paragraphs: [
    "Linus Kapp struck Elias Brenner with the mooring iron on the Münster ferry landing, so the photographs of night batch K-17 would never reach Anna Vogt at the Rathaus.",
    "Nils Frei moved the drums and rehearsed an alibi he had not checked. Nine figures was the fountain of 1977. The piper has been there since 1983. A man on the rim until dawn would have said ten.",
    "Greta Holz was shouting about money and stacking crates. Ida Gerber was opening doors. The pamphlet with 1536 on it was a true sentence used as a wrong road.",
    "The litter was the costume. Picnic waste over a poison habit, and a wet step under a dead man, so the morning report would say he slipped. Cleancentive closes the case the way the killer hoped the city would not: by picking the costume up.",
    "The pillars you walked are not scenery. They are the Stadtreinigung’s own record of waste left where it is not allowed, on a 50 metre grid. The murder used that habit as camouflage. Clearing a block is how the city stays a city."
  ]
};

const CITY_NOTES = {
  rathaus: "Marktplatz is where the canton still takes a report. The same city logs illegal dumps a few streets away. Elias was bringing photographs so the river would enter that record.",
  fischmarkt: "Greta’s crates are a legal pile with a tally. The bags in the city grid are the other kind: wrong sack, too heavy, left on the block. The case turns on that difference.",
  laelle: "The tongue points at Kleinbasel. The dump grid agrees more often than a joke should. Follow the reports across the water, not the rumor.",
  ferry: "A drum can pass for picnic trash if the bottles are arranged. Inland, the grid already names Sonderabfall and Bebbi-Sagg. Elias wanted the landing on that same map.",
  pfalz: "From the terrace the mess becomes a pattern. Reports are snapped to 50 metre squares so a doorway stays private. You can see the block. You cannot see the kitchen.",
  muenster: "A pamphlet is paper in the wrong place. So is a cardboard dump. Ida keeps the square. The cleaning crews keep the grid. Neither of them owned the dye works.",
  barfi: "This square moves people and packaging. Around Steinen the grid fills with Sperrgut and metal — a scrap man’s leftovers, left where the city did not ask for them.",
  tinguely: "The fountain is scrap that was invited. The pillars around it are scrap that was not. Art may keep the iron. The street has a bin for it, and a record when the bin is ignored."
};
