# Parts Editor: complete catalog mapping

Status: rollout in progress. `cafe-table`, `side-table` and `square-cafe-table` are implemented; the other 69 objects remain planned.

Generated from the current 72-object catalog after reading every geometry branch. Every object appears exactly once. Family names below are proposed implementation profiles, not new catalog categories. All multi-part entries include part-specific visual finish/color in addition to listed dimension controls. Repeated components begin as linked groups, then gain individual member editing under the instance rules in the rollout plan.

| Object ID                   | Object                       | Geometry / variant  | Profile           | Wave | Planned selectable parts                                  |
| --------------------------- | ---------------------------- | ------------------- | ----------------- | ---- | --------------------------------------------------------- |
| `cafe-table`                | Orbit café table             | table               | pedestal-tables   | 1    | tabletop, column, base                                    |
| `side-table`                | Round side table             | table               | pedestal-tables   | 1    | tabletop, column, base                                    |
| `square-cafe-table`         | Square café table            | table               | pedestal-tables   | 1    | tabletop, column, base                                    |
| `work-desk`                 | Line work desk               | desk                | standard-desks    | 1    | tabletop, legs, feet, rear-brace                          |
| `coffee-table`              | Low coffee table             | desk                | standard-desks    | 1    | tabletop, legs, feet, rear-brace                          |
| `dining-table`              | Family dining table          | desk                | standard-desks    | 1    | tabletop, legs, feet, rear-brace                          |
| `conference-table`          | Conference table             | desk                | standard-desks    | 1    | tabletop, legs, feet, rear-brace                          |
| `communal-table`            | Communal table               | desk                | standard-desks    | 1    | tabletop, legs, feet, rear-brace                          |
| `standing-desk`             | Standing desk                | desk / standing     | standing-desk     | 1    | tabletop, columns, feet, rear-brace                       |
| `corner-desk`               | L-shaped corner desk         | desk / corner       | corner-desk       | 1    | main-top, return-top, legs                                |
| `patio-table`               | Patio table                  | desk / slatted      | slatted-table     | 1    | top-slats, legs, feet, rear-brace                         |
| `laptop-stand`              | Laptop stand                 | laptop-stand        | laptop-stand      | 1    | platform, support, base, retaining-lip                    |
| `lounge-chair`              | Cove lounge chair            | chair               | armchairs         | 2    | seat, back, legs, armrests                                |
| `meeting-chair`             | Meeting chair                | chair               | armchairs         | 2    | seat, back, legs, armrests                                |
| `dining-chair`              | Dining chair                 | chair / armless     | armless-chairs    | 2    | seat, back, legs                                          |
| `visitor-chair`             | Visitor chair                | chair / armless     | armless-chairs    | 2    | seat, back, legs                                          |
| `outdoor-chair`             | Outdoor chair                | chair / slatted     | slatted-chair     | 2    | seat, back-slats, legs, armrests                          |
| `bar-stool`                 | Perch bar stool              | stool               | stools            | 2    | seat, legs, stretchers                                    |
| `breakfast-stool`           | Breakfast stool              | stool               | stools            | 2    | seat, legs, stretchers                                    |
| `sofa`                      | Studio sofa                  | sofa                | sofas             | 2    | seat-base, back, armrests, cushions, legs                 |
| `reception-sofa`            | Reception sofa               | sofa                | sofas             | 2    | seat-base, back, armrests, cushions, legs                 |
| `garden-bench`              | Garden bench                 | bench / backrest    | backrest-bench    | 2    | seat-slats, back-slats, back-supports, legs               |
| `cafe-bench`                | Café bench                   | bench               | backless-bench    | 2    | seat-slats, legs                                          |
| `office-chair`              | Task office chair            | office-chair        | office-chair      | 2    | seat, back, lift-column, armrests, star-base, casters     |
| `tv-unit`                   | Media TV unit                | cabinet / media     | closed-cabinets   | 3    | carcass, back-panel, plinth, door-fronts, handles         |
| `wardrobe`                  | Tall wardrobe                | cabinet             | closed-cabinets   | 3    | carcass, back-panel, plinth, door-fronts, handles         |
| `bedside-table`             | Bedside table                | cabinet / drawers   | drawer-cabinets   | 3    | carcass, back-panel, plinth, drawer-fronts, handles       |
| `filing-cabinet`            | Filing cabinet               | cabinet / drawers   | drawer-cabinets   | 3    | carcass, back-panel, plinth, drawer-fronts, handles       |
| `drawer-unit`               | Desk drawer unit             | cabinet / drawers   | drawer-cabinets   | 3    | carcass, back-panel, plinth, drawer-fronts, handles       |
| `storage-locker`            | Storage locker               | cabinet / locker    | locker            | 3    | carcass, back-panel, plinth, doors, handles, vents        |
| `display-cabinet`           | Display cabinet              | cabinet / open      | open-cabinet      | 3    | carcass, back-panel, plinth, shelves                      |
| `bookshelf`                 | Grid bookshelf               | shelf               | panel-shelves     | 3    | side-panels, back-panel, shelves                          |
| `wall-shelving`             | Retail wall shelving         | shelf               | panel-shelves     | 3    | side-panels, back-panel, shelves                          |
| `display-rack`              | Frame display rack           | rack                | open-racks        | 3    | uprights, shelves                                         |
| `shoe-rack`                 | Shoe rack                    | rack                | open-racks        | 3    | uprights, shelves                                         |
| `wall-shelf`                | Floating wall shelf          | wall-shelf          | wall-shelf        | 3    | shelf, diagonal-brackets, wall-supports                   |
| `bed-frame`                 | Platform bed frame           | bed                 | bed               | 3    | frame, headboard, mattress, pillows, legs                 |
| `dressing-table`            | Dressing table               | vanity              | vanity            | 3    | worktop, legs, mirror-frame, mirror-surface, drawer-front |
| `kitchen-island`            | Kitchen island               | counter             | counters          | 4    | body, countertop, plinth, front-panels                    |
| `reception-desk`            | Reception desk               | counter             | counters          | 4    | body, countertop, plinth, front-panels                    |
| `service-counter`           | Service counter              | counter             | counters          | 4    | body, countertop, plinth, front-panels                    |
| `bar-counter`               | Bar counter                  | counter             | counters          | 4    | body, countertop, plinth, front-panels                    |
| `checkout-counter`          | Checkout counter             | counter             | counters          | 4    | body, countertop, plinth, front-panels                    |
| `pastry-display-stand`      | Pastry display stand         | tier-stand          | tier-stand        | 4    | uprights, trays                                           |
| `plant-stand`               | Tiered plant stand           | plant-stand         | plant-stand       | 4    | platforms, supports                                       |
| `garment-rail`              | Garment rail                 | rail                | garment-rails     | 4    | uprights, feet, hanging-rail, lower-shelf?                |
| `hanging-rack`              | Hanging clothes rack         | rail / shelf        | garment-rails     | 4    | uprights, feet, hanging-rail, lower-shelf?                |
| `accessory-stand`           | Accessory stand              | accessory           | accessory-stand   | 4    | base, upright, crossbars                                  |
| `brochure-holder`           | Brochure holder              | brochure            | brochure-holder   | 4    | base, upright, pocket-assemblies                          |
| `promotional-stand`         | Promotional display stand    | promo               | promotional-stand | 4    | base, back-panel, lower-shelf, upper-shelf                |
| `freestanding-logo-display` | Freestanding logo display    | logo                | logo-display      | 4    | base, support, logo-bars                                  |
| `floor-lamp`                | Halo floor lamp              | lamp                | floor-table-lamps | 5    | base, stem, shade, diffuser                               |
| `table-lamp`                | Cone table lamp              | lamp                | floor-table-lamps | 5    | base, stem, shade, diffuser                               |
| `pendant-light`             | Dome pendant light           | pendant             | pendants          | 5    | ceiling-canopy, suspension, shade, diffuser               |
| `pendant-lamp`              | Café pendant lamp            | pendant             | pendants          | 5    | ceiling-canopy, suspension, shade, diffuser               |
| `chandelier`                | Branch chandelier            | chandelier          | chandelier        | 5    | canopy, stem, arms, light-heads                           |
| `wall-lamp`                 | Wall lamp                    | wall-light          | wall-lights       | 5    | wall-plate, arm, shade                                    |
| `wall-light`                | Café wall light              | wall-light          | wall-lights       | 5    | wall-plate, arm, shade                                    |
| `mirror`                    | Wall mirror                  | mirror              | mirrors           | 6    | frame, mirror-surface, stand?                             |
| `mirror-stand`              | Freestanding mirror stand    | mirror / standing   | mirrors           | 6    | frame, mirror-surface, stand?                             |
| `workstation-partition`     | Workstation partition        | partition / solid   | partitions        | 6    | panel-or-slats, feet, return-panel?                       |
| `decorative-partition`      | Slatted decorative partition | partition / slatted | partitions        | 6    | panel-or-slats, feet, return-panel?                       |
| `fitting-room-partition`    | Fitting-room partition       | partition / corner  | partitions        | 6    | panel-or-slats, feet, return-panel?                       |
| `whiteboard-stand`          | Whiteboard stand             | board               | boards            | 6    | frame, face, supports, feet?                              |
| `menu-stand`                | Menu stand                   | board / a-frame     | boards            | 6    | frame, face, supports, feet?                              |
| `signboard`                 | Shop signboard               | board / a-frame     | boards            | 6    | frame, face, supports, feet?                              |
| `planter`                   | Indoor planter               | planter             | planters          | 6    | pot, soil, foliage, suspension?                           |
| `hanging-planter`           | Hanging planter              | hanging-planter     | planters          | 6    | pot, soil, foliage, suspension?                           |
| `decorative-sculpture`      | Stacked sculpture            | sculpture           | sculpture         | 6    | base, lower-form, upper-form                              |
| `display-plinth`            | Forma display plinth         | plinth              | single-body-forms | 6    | body; optional connected surface regions later            |
| `product-pedestal`          | Product pedestal             | plinth              | single-body-forms | 6    | body; optional connected surface regions later            |
| `vase`                      | Contour vase                 | vase                | single-body-forms | 6    | body; optional connected surface regions later            |

## Profile controls and connections

### pedestal-tables (wave 1)

Objects: `cafe-table`, `side-table`, `square-cafe-table`.

Selectable parts: tabletop, column, base.

Controls: Top size/shape/thickness; column diameter; base footprint.

Connections and limits: Keep existing café-table IDs. Total height drives column length; top underside and grounded feet remain connected.

### standard-desks (wave 1)

Objects: `work-desk`, `coffee-table`, `dining-table`, `conference-table`, `communal-table`.

Selectable parts: tabletop, legs, feet, rear-brace.

Controls: Top thickness; leg section/inset; foot depth; brace section.

Connections and limits: Overall width/depth describe top envelope. Leg length follows top underside; feet stay on floor; brace spans rear supports.

### standing-desk (wave 1)

Objects: `standing-desk`.

Selectable parts: tabletop, columns, feet, rear-brace.

Controls: Top thickness; support section; foot depth; brace section.

Connections and limits: Two columns follow total height. Preserve standing variant; do not imply animated/telescoping mechanism.

### corner-desk (wave 1)

Objects: `corner-desk`.

Selectable parts: main-top, return-top, legs.

Controls: Shared top thickness; return width/depth; leg section.

Connections and limits: Two existing top slabs share height and meet without gap. Five supports anchor below their respective slabs; keep L-shaped envelope.

### slatted-table (wave 1)

Objects: `patio-table`.

Selectable parts: top-slats, legs, feet, rear-brace.

Controls: Linked slat thickness/gap; leg section; foot depth.

Connections and limits: Seven slats remain evenly spaced within top envelope. Gap changes derive slat width; no independent width/gap conflict.

### laptop-stand (wave 1)

Objects: `laptop-stand`.

Selectable parts: platform, support, base, retaining-lip.

Controls: Platform thickness; support section; base footprint; lip height.

Connections and limits: Support endpoints track base and platform; lip remains on platform front edge. Preserve current unhinged geometry.

### armchairs (wave 2)

Objects: `lounge-chair`, `meeting-chair`.

Selectable parts: seat, back, legs, armrests.

Controls: Seat thickness/height; back thickness; leg section; armrest height.

Connections and limits: Legs follow seat underside; arm supports follow armrests. Total height anchors back top; width/depth contain all pieces.

### armless-chairs (wave 2)

Objects: `dining-chair`, `visitor-chair`.

Selectable parts: seat, back, legs.

Controls: Seat thickness/height; back thickness; leg section.

Connections and limits: Use chair rules with no armrest parts or controls.

### slatted-chair (wave 2)

Objects: `outdoor-chair`.

Selectable parts: seat, back-slats, legs, armrests.

Controls: Seat thickness/height; linked back-slat width/gap; leg section; arm height.

Connections and limits: Five existing back slats share spacing constraints; preserve outdoor-chair arms and supports.

### stools (wave 2)

Objects: `bar-stool`, `breakfast-stool`.

Selectable parts: seat, legs, stretchers.

Controls: Seat shape/thickness; leg section; stretcher height/section.

Connections and limits: Four splayed legs attach to seat; four horizontal stretchers connect the legs at a shared constrained level.

### sofas (wave 2)

Objects: `sofa`, `reception-sofa`.

Selectable parts: seat-base, back, armrests, cushions, legs.

Controls: Base/cushion thickness; back thickness; arm width; leg height.

Connections and limits: Fit cushions between arms. Existing geometry changes cushion count at width >190 cm; formalize this topology before exposing per-cushion overrides.

### backrest-bench (wave 2)

Objects: `garden-bench`.

Selectable parts: seat-slats, back-slats, back-supports, legs.

Controls: Linked seat/back slat thickness/gap; seat height; support section.

Connections and limits: Four seat slats and three back slats remain attached; back supports extend from seat to back top.

### backless-bench (wave 2)

Objects: `cafe-bench`.

Selectable parts: seat-slats, legs.

Controls: Linked slat thickness/gap; leg section.

Connections and limits: No backrest controls. Four slats retain overall top envelope and derived leg length.

### office-chair (wave 2)

Objects: `office-chair`.

Selectable parts: seat, back, lift-column, armrests, star-base, casters.

Controls: Seat height/thickness; back thickness; column diameter; arm height; base radius; caster size.

Connections and limits: Five arms/casters stay radial and grounded; seat and back remain attached. No swivel, tilt or mechanical travel simulation.

### closed-cabinets (wave 3)

Objects: `tv-unit`, `wardrobe`.

Selectable parts: carcass, back-panel, plinth, door-fronts, handles.

Controls: Panel thickness; plinth height; front thickness/gap; handle size.

Connections and limits: Frame opening drives front sizes. Media variant currently uses closed vertical panels too; do not invent open media bays.

### drawer-cabinets (wave 3)

Objects: `bedside-table`, `filing-cabinet`, `drawer-unit`.

Selectable parts: carcass, back-panel, plinth, drawer-fronts, handles.

Controls: Panel thickness; plinth height; drawer-front thickness/gap; handle size.

Connections and limits: Only fronts and handles currently exist. Keep fixed per-object panel counts; no drawer boxes or opening animation.

### locker (wave 3)

Objects: `storage-locker`.

Selectable parts: carcass, back-panel, plinth, doors, handles, vents.

Controls: Panel thickness; door gap; handle size; linked vent size.

Connections and limits: Two doors retain their own handles and three decorative vent bars each. Bars are surface geometry, not cutout holes.

### open-cabinet (wave 3)

Objects: `display-cabinet`.

Selectable parts: carcass, back-panel, plinth, shelves.

Controls: Panel/shelf thickness; shelf count; constrained shelf positions.

Connections and limits: Current shelves count gives count-1 internal boards plus carcass top/bottom. Preserve that v1/v2 appearance and explain count semantics before changing labels.

### panel-shelves (wave 3)

Objects: `bookshelf`, `wall-shelving`.

Selectable parts: side-panels, back-panel, shelves.

Controls: Panel/back/shelf thickness; shelf count; internal shelf positions.

Connections and limits: Lowest and highest counted shelves bound the assembly; internal shelves fit between sides with non-overlap constraints.

### open-racks (wave 3)

Objects: `display-rack`, `shoe-rack`.

Selectable parts: uprights, shelves.

Controls: Upright section; shelf thickness/count; internal shelf positions.

Connections and limits: Four posts retain envelope; shelves fit inside/around the existing frame with explicit attachment rules.

### wall-shelf (wave 3)

Objects: `wall-shelf`.

Selectable parts: shelf, diagonal-brackets, wall-supports.

Controls: Shelf thickness; bracket section; bracket spacing.

Connections and limits: Bracket endpoints follow shelf underside and wall support. Wall mounting has no strength calculation.

### bed (wave 3)

Objects: `bed-frame`.

Selectable parts: frame, headboard, mattress, pillows, legs.

Controls: Frame thickness; headboard thickness; mattress thickness; leg height.

Connections and limits: Mattress rests on frame; pillows follow mattress top; headboard remains at head end. Soft pieces retain bounded visual geometry.

### vanity (wave 3)

Objects: `dressing-table`.

Selectable parts: worktop, legs, mirror-frame, mirror-surface, drawer-front.

Controls: Top thickness/height; leg section; mirror inset; drawer-front dimensions.

Connections and limits: Mirror frame/surface stay nested behind top; current box is a decorative drawer block, not an opening mechanism.

### counters (wave 4)

Objects: `kitchen-island`, `reception-desk`, `service-counter`, `bar-counter`, `checkout-counter`.

Selectable parts: body, countertop, plinth, front-panels.

Controls: Countertop thickness; plinth height; front-panel thickness/gap.

Connections and limits: Three existing front panels remain aligned to body; increasing top thickness adjusts body height without changing total height.

### tier-stand (wave 4)

Objects: `pastry-display-stand`.

Selectable parts: uprights, trays.

Controls: Tray count/thickness; per-tier size; upright section.

Connections and limits: Trays taper with level; enforce decreasing footprint and attachment to rear posts. Lowest/highest tiers keep envelope anchors.

### plant-stand (wave 4)

Objects: `plant-stand`.

Selectable parts: platforms, supports.

Controls: Three platform thicknesses/heights; support section.

Connections and limits: Three stepped platforms retain width layout; each support pair derives its height from the corresponding platform.

### garment-rails (wave 4)

Objects: `garment-rail`, `hanging-rack`.

Selectable parts: uprights, feet, hanging-rail, lower-shelf?.

Controls: Rail/upright section; foot depth; optional shelf thickness/height.

Connections and limits: Only hanging-rack has the existing lower shelf. Rail spans supports; feet stay grounded.

### accessory-stand (wave 4)

Objects: `accessory-stand`.

Selectable parts: base, upright, crossbars.

Controls: Base thickness/footprint; upright section; linked bar length/section.

Connections and limits: Two crossbars stay centered on upright at constrained levels; no added hooks.

### brochure-holder (wave 4)

Objects: `brochure-holder`.

Selectable parts: base, upright, pocket-assemblies.

Controls: Base footprint/thickness; upright section; linked pocket depth/lip height.

Connections and limits: Three existing pockets each group back, floor and lip; keep fronts open and anchored to upright.

### promotional-stand (wave 4)

Objects: `promotional-stand`.

Selectable parts: base, back-panel, lower-shelf, upper-shelf.

Controls: Base height; panel thickness; shelf thickness/heights.

Connections and limits: Shelf edges and back panel stay connected; heights are ordered inside overall envelope.

### logo-display (wave 4)

Objects: `freestanding-logo-display`.

Selectable parts: base, support, logo-bars.

Controls: Base footprint/height; support section; linked logo depth.

Connections and limits: Existing three bars form a fixed stylized mark, not editable text or uploaded logo. Keep their connecting silhouette.

### floor-table-lamps (wave 5)

Objects: `floor-lamp`, `table-lamp`.

Selectable parts: base, stem, shade, diffuser.

Controls: Base footprint/thickness; stem diameter; shade size/height; diffuser inset.

Connections and limits: Shade follows stem endpoint; stem length derives from total height and shade. Diffuser remains at shade opening.

### pendants (wave 5)

Objects: `pendant-light`, `pendant-lamp`.

Selectable parts: ceiling-canopy, suspension, shade, diffuser.

Controls: Canopy size; suspension section; shade height/footprint.

Connections and limits: Overall height is the hanging drop, anchored at ceiling canopy. Shade/diffuser fit together; suspension bridges remaining distance.

### chandelier (wave 5)

Objects: `chandelier`.

Selectable parts: canopy, stem, arms, light-heads.

Controls: Stem/arm section; radial arm reach; linked head size.

Connections and limits: Five arms and five heads retain radial positions and connections. Heads are modeled ellipsoids, not physical light emitters.

### wall-lights (wave 5)

Objects: `wall-lamp`, `wall-light`.

Selectable parts: wall-plate, arm, shade.

Controls: Plate size/thickness; arm section/reach; shade height.

Connections and limits: Wall plane anchors plate; arm endpoint follows shade position; preserve depth envelope and attachment overlap.

### mirrors (wave 6)

Objects: `mirror`, `mirror-stand`.

Selectable parts: frame, mirror-surface, stand?.

Controls: Frame thickness/inset; surface inset; standing support section/spread.

Connections and limits: Wall mirror has no stand. Standing mirror keeps supports grounded; surface stays inside frame. Reflection is approximate shader appearance.

### partitions (wave 6)

Objects: `workstation-partition`, `decorative-partition`, `fitting-room-partition`.

Selectable parts: panel-or-slats, feet, return-panel?.

Controls: Panel thickness; linked slat width/gap; feet depth; return depth.

Connections and limits: Solid has one panel; slatted has nine slats; corner adds existing short return panel. Do not generate a full fitting-room wall absent from geometry.

### boards (wave 6)

Objects: `whiteboard-stand`, `menu-stand`, `signboard`.

Selectable parts: frame, face, supports, feet?.

Controls: Frame thickness/inset; face thickness; support section/spread.

Connections and limits: Whiteboard has two posts/feet; A-frame menu/sign boards have four splayed supports and no extra foot blocks. No text editor or drawing surface in this scope.

### planters (wave 6)

Objects: `planter`, `hanging-planter`.

Selectable parts: pot, soil, foliage, suspension?.

Controls: Pot height/footprint; foliage visual scale; suspension section.

Connections and limits: Soil stays at pot rim and foliage originates there. Hanging variant has three straps converging at top anchor. Pot/foliage stay within declared envelope.

### sculpture (wave 6)

Objects: `decorative-sculpture`.

Selectable parts: base, lower-form, upper-form.

Controls: Base height/footprint; constrained lower/upper proportions.

Connections and limits: Keep two ellipsoids visually connected with limited overlap; part edits cannot separate the stack.

### single-body-forms (wave 6)

Objects: `display-plinth`, `product-pedestal`, `vase`.

Selectable parts: body; optional connected surface regions later.

Controls: Whole-body dimensions/shape and finish.

Connections and limits: Plinths are one primitive each; vase is one connected lathe surface. Do not invent removable tops, feet or seams. Later vase neck/body/foot finish regions require triangle ownership with no duplicate surfaces.

## Coverage

72 objects; 41 profiles. Wave counts: 1: 12; 2: 12; 3: 14; 4: 13; 5: 7; 6: 14. Wave 1 includes the already released café table.

The machine-readable companion is `parts-editor-catalog-map.json`. See `parts-editor-all-objects-plan.md` for shared architecture, instance behavior, migration, implementation order and release gates.
