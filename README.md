# Cleancentive — The Silent Ferry

A self-guided murder mystery you walk through Basel, and a plogging route at the same time. The streets, ferries, and fountains are real. The murder is not.

Cleancentive is the idea underneath the case: people will move through a city for a story, so the story should leave the city cleaner than it found it. You play a Rhine witness. You also pick up litter.

## A palace hunt, moved to the Rhine

The shape of the game comes from the self-guided [Stockholm murder mystery hunt by the Royal Palace](https://www.getyourguide.com/stockholm-l50/stockholm-murder-mystery-hunt-by-the-royal-palace-t1268258/). That hunt sends a small group through Gamla Stan with no actor and no tour guide. Clues sit in the streets. You solve one, and the next place opens. It takes a couple of hours, and it works best with two to four people.

The Silent Ferry keeps that rhythm and leaves the Stockholm plot behind. There is no envelope from a shop in the old town, and no borrowed detective. Basel gets its own case, written for the Grossbasel bank of the Rhine: the Rathaus arcade, the Fischmarkt fountain, the Lällekönig sticking his tongue out at Kleinbasel, the Münster ferry, the Pfalz, the cathedral square, Barfüsserplatz, and the Tinguely fountain.

## The case

Elias Brenner captains the Münster ferry, the *Leu*. He was due at the Rathaus at seven with photographs the canton needed before the morning boats. At dawn he is found on the landing below the Pfalz. The report says he slipped on wet litter.

Anna Vogt hands you what is left of his notebook. The first page is dry. The rest is Rhine water. Someone arranged bottles around a dead man so a constable would see a mess and close the book. In this story, ordinary trash is a costume. It hides a chemical habit and a murder.

Four people had a reason to be in the file: a coffee seller with a temper, a night chemist across the river, a scrap hauler, and a guide at the Münster. You do not accuse anyone until you have walked the route. Each chapter asks you to look at the building, the fountain, the bridge, or the terrace in front of you, then keeps the next page shut until you have patrolled that spot.

## Move, then pick up

The hunt is about two kilometres on public paths, a little over half an hour of walking if you do not linger, longer once you stop to look and to clean. Stay on the Grossbasel side. Do not cross the Mittlere Brücke. The written directions keep you on the riverside path, up the Pfalz stairs, and down through the old town to Theaterplatz.

| Chapter | Where you stand | What the city is doing there |
| --- | --- | --- |
| I | Rathaus, Marktplatz | Cups and butts before the square sits down to coffee |
| II | Fischmarktbrunnen | Litter in the basin joints and under the benches |
| III | Lällekönig, Schifflände | Cans and plastic the wind parks against the railing |
| IV | Münsterfähre *Leu* | The bank in the story, and a real morning landing |
| V | Pfalz | Picnic waste along a lookout wall |
| VI | Münsterplatz | Paper in the corners of a windy square |
| VII | Barfüsserplatz | A tram hub that never really closes |
| VIII | Fasnachtsbrunnen, Theaterplatz | The rim and the paths — the basin is art, so leave it |

Two ways to play:

- **On the Rhine.** Walk the pins. The phone can tell you how far you are from the next stop. It does not lock the chapter, because old-town GPS and stops this close together are not a fair gate.
- **Table read.** Play the whole case from a café. Each site plate carries the fact you would have checked on the stone.

Puzzles are things you can see or count: arches, a tally, a year on a bridge, a figure in a fountain. A wrong answer stays wrong. The next chapter opens only after a patrol log.

## Plogging

Plogging is the Swedish habit of picking up litter while you jog (*plocka upp* + jogging). This hunt is the walking version. The mystery is the reason to leave the house. The patrol is the reason the walk is useful.

After every puzzle you log what you actually lifted: cigarette butts, plastic, paper, glass, metal, food waste, other safe litter. An already-clean square is a valid log. The city being tidy is a result, not a failure. Photos stay on the phone. Nothing is uploaded.

Hazards are the other half of the environmental rule. Needles, chemicals, batteries, and drums are reported and not touched. You do not enter the Rhine, you do not climb off the public stairs, and you do not fish souvenirs out of the Tinguely basin.

The 3D map is not painted scenery. Pillars are Basel-Stadt’s own record of waste left where it is not allowed, from the Stadtreinigung illegal-dump dataset, snapped to a 50 metre grid so a doorway stays private. Official drop-off points appear when the live feed answers. If the network fails, a small sample of recent reports keeps the map honest enough to play. Filing a nearby block seeds your patrol counts. Clearing a block is how the costume comes off the street.

## How it ends

There is no voucher and no cash prize. When the accusation is right, the case closes and the phone writes a Rhine Witness Report: who you named, what you cleared, which hazards you refused to touch, how long you were out, and which city blocks you filed. You can download it, print it, or share it. That report is the prize. It is also the only score the city can use.

## Play it

Open `index.html` in a browser, or serve the folder so the map tiles load reliably:

```bash
python3 -m http.server 8891
```

Then go to `http://localhost:8891`. The game keeps your progress in this browser under `cleancentive-silent-ferry-v1`. No account.

Best with two to four people. One reads, one navigates, everyone patrols. Two teams can race the same route with separate logs. The city gets cleaner either way.
