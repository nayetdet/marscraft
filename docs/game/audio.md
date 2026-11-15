# Game audio inventory

## Current coverage

| Area | Audio feedback |
|---|---|
| Movement and rover | Habitat/surface footsteps and rover motor loops |
| World interaction | Regolith placement, mining, block-break impacts, landing, and rocket arrival |
| Airlock and suit | Door cycles, decompression, manual crank, suit equip, and suit dock |
| Survival | Danger loop, damage cue with cooldown, and successful food use |
| Interface | Menu navigation, inventory, journal, scanner open/close, terminal actions, and modal navigation |
| Scanner and science | Confirmation when a scan completes and when science is sent |
| Greenhouse | Click when a crop drag starts, then success/error feedback on drop; no sound while the pointer moves |
| Stations and rover | Success/error cues for actions; rover interaction feedback is separate from its motor loop |
| Procedural effects | Mars wind and solar-panel brushing are generated with Web Audio in `src/audio/AudioManager.ts` |

Interface sounds are event-driven. Frame updates do not emit click sounds. Controls that already give a success/error cue skip the generic click, so an action produces one clear response.

## Added sound assets

These five OGG files are from Kenney's sound packs. Kenney identifies both packs as Creative Commons CC0; the asset pages link to the license and are the source of record.

| File | Original sample | Use | Source |
|---|---|---|---|
| `ui-click-kenney.ogg` | Click 001 | Menu, inventory, journal, scanner, and terminal navigation | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds); [sample listing](https://instrictlogic.com/AssetLibrary/sounds/banks/interface-clicks-buttons-notifications-kenney-26bde112/) |
| `ui-confirm-kenney.ogg` | Confirmation 001 | Successful station actions, scans, food use, and system interactions | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds); [sample listing](https://instrictlogic.com/AssetLibrary/sounds/banks/interface-clicks-buttons-notifications-kenney-26bde112/) |
| `ui-error-kenney.ogg` | Error 001 | Failed actions and damage feedback | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds); [sample listing](https://instrictlogic.com/AssetLibrary/sounds/banks/interface-clicks-buttons-notifications-kenney-26bde112/) |
| `sci-fi-door-open-kenney.ogg` | Door Open 001 | Suit equip mechanism | [Kenney Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds); [sample listing](https://instrictlogic.com/AssetLibrary/sounds/banks/sci-fi-machines-interfaces-kenney-ffdaaff2/) |
| `sci-fi-door-close-kenney.ogg` | Door Close 001 | Suit dock mechanism | [Kenney Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds); [sample listing](https://instrictlogic.com/AssetLibrary/sounds/banks/sci-fi-machines-interfaces-kenney-ffdaaff2/) |

Creator: [Kenney](https://kenney.nl/). License: [Creative Commons CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The computer-noise file mentioned in an earlier draft is not present in the project and is not used.

## Pre-existing WAV files

The following WAV files were already in the repository before the Kenney assets were added:

- `andando dentro da nave.wav`
- `andando na areia.wav`
- `barulho do carro.wav`
- `colocando_areia.WAV`
- `descompressao.wav`
- `foguete.wav`
- `morrendo.wav`
- `porta_abrir.wav`
- `porta_fechar.wav`
- `quebrando_areia.WAV`
- `quebrando_pedra.WAV`
- `queda_areia.wav`

The repository history and file metadata do not record their creators, source URLs, licenses, or whether they were generated. Their provenance must be confirmed before the submission can accurately credit or redistribute them. This inventory deliberately does not claim that these files are CC0 or project-authored.
