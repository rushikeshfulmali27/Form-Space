# Parts Editor: complete catalog mapping

Status: rollout in progress. **39/72 objects implemented; 33 remain planned.** V1.9 adds five shelving models, six closed-storage models, wall shelf, bed, vanity and kitchen island.

Generated from the current 72-object catalog after reading every geometry branch. Every object appears exactly once. Family names below are proposed implementation profiles, not new catalog categories. All multi-part entries include part-specific visual finish/color in addition to listed dimension controls. Repeated components begin as linked groups, then gain individual member editing under the instance rules in the rollout plan.

| Object ID | Object | Geometry / variant | Profile | Wave | Selectable parts | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `cafe-table` | Orbit café table | table | pedestal-tables | 1 | tabletop, column, base | implemented |
| `side-table` | Round side table | table | pedestal-tables | 1 | tabletop, column, base | implemented |
| `square-cafe-table` | Square café table | table | pedestal-tables | 1 | tabletop, column, base | implemented |
| `work-desk` | Line work desk | desk | standard-desks | 1 | tabletop, legs, feet, rear-brace | implemented |
| `coffee-table` | Low coffee table | desk | standard-desks | 1 | tabletop, legs, feet, rear-brace | implemented |
| `dining-table` | Family dining table | desk | standard-desks | 1 | tabletop, legs, feet, rear-brace | implemented |
| `conference-table` | Conference table | desk | standard-desks | 1 | tabletop, legs, feet, rear-brace | implemented |
| `communal-table` | Communal table | desk | standard-desks | 1 | tabletop, legs, feet, rear-brace | implemented |
| `standing-desk` | Standing desk | desk / standing | standing-desk | 1 | tabletop, columns, feet, rear-brace | implemented |
| `corner-desk` | L-shaped corner desk | desk / corner | corner-desk | 1 | main-top, return-top, legs | implemented |
| `patio-table` | Patio table | desk / slatted | slatted-table | 1 | top-slats, legs, feet, rear-brace | implemented |
| `laptop-stand` | Laptop stand | laptop-stand | laptop-stand | 1 | platform, support, base, retaining-lip | implemented |
| `lounge-chair` | Cove lounge chair | chair | armchairs | 2 | seat, back, legs, armrests | implemented |
| `meeting-chair` | Meeting chair | chair | armchairs | 2 | seat, back, legs, armrests | implemented |
| `dining-chair` | Dining chair | chair / armless | armless-chairs | 2 | seat, back, legs | implemented |
| `visitor-chair` | Visitor chair | chair / armless | armless-chairs | 2 | seat, back, legs | implemented |
| `outdoor-chair` | Outdoor chair | chair / slatted | slatted-chair | 2 | seat, back-slats, legs, armrests | implemented |
| `bar-stool` | Perch bar stool | stool | stools | 2 | seat, legs, stretchers | implemented |
| `breakfast-stool` | Breakfast stool | stool | stools | 2 | seat, legs, stretchers | implemented |
| `sofa` | Studio sofa | sofa | sofas | 2 | base, back, arms, cushions, legs | implemented |
| `reception-sofa` | Reception sofa | sofa | sofas | 2 | base, back, arms, cushions, legs | implemented |
| `garden-bench` | Garden bench | bench / backrest | backrest-bench | 2 | seat-slats, bearers, legs, back-slats, back-supports | implemented |
| `cafe-bench` | Café bench | bench | backless-bench | 2 | seat-slats, bearers, legs | implemented |
| `office-chair` | Task office chair | office-chair | office-chair | 2 | seat, back, column, armrests, arm-supports, star-base, casters | implemented |
| `tv-unit` | Media TV unit | cabinet / media | closed-cabinets | 3 | plinth, sides, top, bottom, back, fronts, handles | implemented |
| `wardrobe` | Tall wardrobe | cabinet | closed-cabinets | 3 | plinth, sides, top, bottom, back, fronts, handles | implemented |
| `bedside-table` | Bedside table | cabinet / drawers | drawer-cabinets | 3 | plinth, sides, top, bottom, back, fronts, handles | implemented |
| `filing-cabinet` | Filing cabinet | cabinet / drawers | drawer-cabinets | 3 | plinth, sides, top, bottom, back, fronts, handles | implemented |
| `drawer-unit` | Desk drawer unit | cabinet / drawers | drawer-cabinets | 3 | plinth, sides, top, bottom, back, fronts, handles | implemented |
| `storage-locker` | Storage locker | cabinet / locker | locker | 3 | plinth, sides, top, bottom, back, fronts, handles, vents | implemented |
| `display-cabinet` | Display cabinet | cabinet / open | open-cabinet | 3 | sides, back, plinth, bottom, top, shelves | implemented |
| `bookshelf` | Grid bookshelf | shelf | panel-shelves | 3 | sides, back, shelves | implemented |
| `wall-shelving` | Retail wall shelving | shelf | panel-shelves | 3 | sides, back, shelves | implemented |
| `display-rack` | Frame display rack | rack | open-racks | 3 | posts, shelves | implemented |
| `shoe-rack` | Shoe rack | rack | open-racks | 3 | posts, shelves | implemented |
| `wall-shelf` | Floating wall shelf | wall-shelf | wall-shelf | 3 | board, mounts, brackets | implemented |
| `bed-frame` | Platform bed frame | bed | bed | 3 | frame, headboard, mattress, pillows, legs | implemented |
| `dressing-table` | Dressing table | vanity | vanity | 3 | worktop, mirror-frame, mirror, mirror-support, drawer-block, legs | implemented |
| `kitchen-island` | Kitchen island | counter | counters | 4 | body, top, plinth, fronts | implemented |
| `reception-desk` | Reception desk | counter | counters | 4 | body, countertop, plinth, front-panels | planned |
| `service-counter` | Service counter | counter | counters | 4 | body, countertop, plinth, front-panels | planned |
| `bar-counter` | Bar counter | counter | counters | 4 | body, countertop, plinth, front-panels | planned |
| `checkout-counter` | Checkout counter | counter | counters | 4 | body, countertop, plinth, front-panels | planned |
| `pastry-display-stand` | Pastry display stand | tier-stand | tier-stand | 4 | uprights, trays | planned |
| `plant-stand` | Tiered plant stand | plant-stand | plant-stand | 4 | platforms, supports | planned |
| `garment-rail` | Garment rail | rail | garment-rails | 4 | uprights, feet, hanging-rail, lower-shelf? | planned |
| `hanging-rack` | Hanging clothes rack | rail / shelf | garment-rails | 4 | uprights, feet, hanging-rail, lower-shelf? | planned |
| `accessory-stand` | Accessory stand | accessory | accessory-stand | 4 | base, upright, crossbars | planned |
| `brochure-holder` | Brochure holder | brochure | brochure-holder | 4 | base, upright, pocket-assemblies | planned |
| `promotional-stand` | Promotional display stand | promo | promotional-stand | 4 | base, back-panel, lower-shelf, upper-shelf | planned |
| `freestanding-logo-display` | Freestanding logo display | logo | logo-display | 4 | base, support, logo-bars | planned |
| `floor-lamp` | Halo floor lamp | lamp | floor-table-lamps | 5 | base, stem, shade, diffuser | planned |
| `table-lamp` | Cone table lamp | lamp | floor-table-lamps | 5 | base, stem, shade, diffuser | planned |
| `pendant-light` | Dome pendant light | pendant | pendants | 5 | ceiling-canopy, suspension, shade, diffuser | planned |
| `pendant-lamp` | Café pendant lamp | pendant | pendants | 5 | ceiling-canopy, suspension, shade, diffuser | planned |
| `chandelier` | Branch chandelier | chandelier | chandelier | 5 | canopy, stem, arms, light-heads | planned |
| `wall-lamp` | Wall lamp | wall-light | wall-lights | 5 | wall-plate, arm, shade | planned |
| `wall-light` | Café wall light | wall-light | wall-lights | 5 | wall-plate, arm, shade | planned |
| `mirror` | Wall mirror | mirror | mirrors | 6 | frame, mirror-surface, stand? | planned |
| `mirror-stand` | Freestanding mirror stand | mirror / standing | mirrors | 6 | frame, mirror-surface, stand? | planned |
| `workstation-partition` | Workstation partition | partition / solid | partitions | 6 | panel-or-slats, feet, return-panel? | planned |
| `decorative-partition` | Slatted decorative partition | partition / slatted | partitions | 6 | panel-or-slats, feet, return-panel? | planned |
| `fitting-room-partition` | Fitting-room partition | partition / corner | partitions | 6 | panel-or-slats, feet, return-panel? | planned |
| `whiteboard-stand` | Whiteboard stand | board | boards | 6 | frame, face, supports, feet? | planned |
| `menu-stand` | Menu stand | board / a-frame | boards | 6 | frame, face, supports, feet? | planned |
| `signboard` | Shop signboard | board / a-frame | boards | 6 | frame, face, supports, feet? | planned |
| `planter` | Indoor planter | planter | planters | 6 | pot, soil, foliage, suspension? | planned |
| `hanging-planter` | Hanging planter | hanging-planter | planters | 6 | pot, soil, foliage, suspension? | planned |
| `decorative-sculpture` | Stacked sculpture | sculpture | sculpture | 6 | base, lower-form, upper-form | planned |
| `display-plinth` | Forma display plinth | plinth | single-body-forms | 6 | body; optional connected surface regions later | planned |
| `product-pedestal` | Product pedestal | plinth | single-body-forms | 6 | body; optional connected surface regions later | planned |
| `vase` | Contour vase | vase | single-body-forms | 6 | body; optional connected surface regions later | planned |

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

Selectable parts: base, back, arms, cushions, legs.

Controls: Base height/thickness; back depth; arm top height/width; 1–4 cushions with thickness/gap and individual finish; leg section.

Connections and limits: Cushions fit between arms and follow the base top. Explicit stable slots survive width edits; legacy two/three counts migrate from original width. Highest slots are removed on decrease; Undo restores settings.

### backrest-bench (wave 2)

Objects: `garden-bench`.

Selectable parts: seat-slats, bearers, legs, back-slats, back-supports.

Controls: Seat height and gap; linked/individual seat thickness, back-board height/depth, bearer/leg/post sections and finishes.

Connections and limits: Four seat slats connect through two under-seat bearers to grounded legs; three back slats attach to posts. Back spacing is derived from seat and board heights.

### backless-bench (wave 2)

Objects: `cafe-bench`.

Selectable parts: seat-slats, bearers, legs.

Controls: Shared seat gap; linked/individual slat thickness, bearer/leg sections and finishes.

Connections and limits: No backrest controls. Four level boards connect through two bearers to the legs; seat top defines overall height.

### office-chair (wave 2)

Objects: `office-chair`.

Selectable parts: seat, back, column, armrests, arm-supports, star-base, casters.

Controls: Seat top height/thickness; back depth; column diameter; armrest top height/section; base-arm section/shared inset; caster diameter and finishes.

Connections and limits: Five fixed angular slots keep casters grounded and attached to their matching base arms, the column and seat. Larger members pull the footprint inward; back and arm supports attach to the seat. No swivel, tilt or mechanical travel simulation.

### closed-cabinets (wave 3)

Objects: `tv-unit`, `wardrobe`.

Selectable parts: plinth, sides.left/right, top, bottom, back, fronts.01–N, handles.01–N.

Controls: Plinth height; side/top/bottom/back/front thickness; shared front gap; individual handle section.

Connections and limits: Fixed closed door overlays meet top/bottom anchors; each handle follows its front.

### drawer-cabinets (wave 3)

Objects: `bedside-table`, `filing-cabinet`, `drawer-unit`.

Selectable parts: plinth, sides.left/right, top, bottom, back, fronts.01–N, handles.01–N.

Controls: Plinth height; side/top/bottom/back/front thickness; shared front gap; individual handle section.

Connections and limits: Fixed closed drawer overlays meet side anchors; handles follow their front. Counts match the original catalog.

### locker (wave 3)

Objects: `storage-locker`.

Selectable parts: plinth, sides, top, bottom, back, fronts, handles, vents.

Controls: Panel thickness, plinth height, front gap, handle section; independent finishes including each fixed vent strip.

Connections and limits: Two closed fronts retain three decorative vent strips each; strips follow their front. No functional ventilation or opening mechanism.

### open-cabinet (wave 3)

Objects: `display-cabinet`.

Selectable parts: sides.left/right, back, plinth, bottom, top, shelves.01–N.

Controls: Open bay count 2–6; panel thickness; plinth height; internal shelf thickness/center height.

Connections and limits: Count preserves legacy bay semantics: count minus one internal shelves, plus fixed bottom/top. Stable slots and disjoint safe bands.

### panel-shelves (wave 3)

Objects: `bookshelf`, `wall-shelving`.

Selectable parts: sides.left/right, back, shelves.01–N.

Controls: Board count 2–6; side/back/shelf thickness; internal shelf center heights.

Connections and limits: First/last boards anchor floor/top; inner boards fit between sides and meet the back. Safe bands prevent crossing.

### open-racks (wave 3)

Objects: `display-rack`, `shoe-rack`.

Selectable parts: posts.front-left/front-right/rear-left/rear-right, shelves.01–N.

Controls: Board count 2–6; linked/individual post section and shelf thickness; internal center heights.

Connections and limits: Four full-height posts define the envelope. Shelf corners overlap the posts; safe bands prevent crossing.

### wall-shelf (wave 3)

Objects: `wall-shelf`.

Selectable parts: board, mounts.left/right, brackets.left/right.

Controls: Board thickness; linked/individual mount and bracket section.

Connections and limits: Mounts follow the wall edge; diagonal bracket endpoints meet mounts and board underside. Spacing is derived, not editable.

### bed (wave 3)

Objects: `bed-frame`.

Selectable parts: frame, headboard, mattress, pillows.left/right, legs.front-left/front-right/rear-left/rear-right.

Controls: Platform top height/thickness; headboard/mattress/pillow thickness; leg section.

Connections and limits: Mattress rests on platform; pillows follow its top; legs follow frame underside. Headboard anchors total height; soft pieces retain rounded edges.

### vanity (wave 3)

Objects: `dressing-table`.

Selectable parts: worktop, legs, mirror-frame, mirror, mirror-support, drawer-block.

Controls: Worktop top height/thickness; leg/support section; mirror frame border/depth; drawer-block height.

Connections and limits: Support joins worktop to mirror frame. Mirror surface stays within border. Decorative drawer block remains closed.

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
