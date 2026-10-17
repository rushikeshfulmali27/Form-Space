// Stable IDs are shared by filters, prompts and saved designs.
export const TAXONOMY = [
  {
    id: "Home",
    label: "Home",
    subcategories: [
      { id: "home-living", label: "Living room" },
      { id: "home-bedroom", label: "Bedroom" },
      { id: "home-dining", label: "Dining & kitchen" },
      { id: "home-lighting", label: "Lighting" },
      { id: "home-decoration", label: "Decoration" },
      { id: "home-outdoor", label: "Outdoor" },
    ],
  },
  {
    id: "Office",
    label: "Office",
    subcategories: [
      { id: "office-workstations", label: "Workstations" },
      { id: "office-seating", label: "Seating" },
      { id: "office-storage", label: "Storage" },
      { id: "office-shared", label: "Shared spaces" },
    ],
  },
  {
    id: "Cafe",
    label: "Café",
    subcategories: [
      { id: "cafe-tables", label: "Tables & seating" },
      { id: "cafe-counters", label: "Counters & displays" },
      { id: "cafe-decor", label: "Lighting & decoration" },
    ],
  },
  {
    id: "Shop",
    label: "Shop",
    subcategories: [
      { id: "shop-products", label: "Product displays" },
      { id: "shop-clothing", label: "Clothing displays" },
      { id: "shop-fixtures", label: "Counters & fixtures" },
      { id: "shop-signs", label: "Signs & promotion" },
    ],
  },
];
export const categoryLabel = (id) =>
  TAXONOMY.find((c) => c.id === id)?.label || id;
export const subcategoryLabel = (id) =>
  TAXONOMY.flatMap((c) => c.subcategories).find((s) => s.id === id)?.label ||
  id;
const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function filterCatalog(
  catalog,
  { category = "All", subcategory = "All", query = "" } = {},
) {
  const words = fold(query).trim().split(/\s+/).filter(Boolean);
  return catalog.filter(
    (o) =>
      (category === "All" || o.category === category) &&
      (subcategory === "All" || o.subcategory === subcategory) &&
      words.every((word) =>
        fold(
          [
            o.name,
            o.id.replaceAll("-", " "),
            o.tag,
            categoryLabel(o.category),
            subcategoryLabel(o.subcategory),
            ...(o.aliases || []),
          ].join(" "),
        ).includes(word),
      ),
  );
}
export function createCatalog(p) {
  const items = [];
  function add(
    id,
    name,
    subcategory,
    kind,
    width,
    height,
    depth,
    options = {},
  ) {
    const category = TAXONOMY.find((c) =>
      c.subcategories.some((s) => s.id === subcategory),
    )?.id;
    if (!category) throw Error("Unknown object subcategory: " + subcategory);
    const {
      color = "oak",
      accent = "black",
      material = "oak",
      ...rest
    } = options;
    items.push({
      id,
      name,
      category,
      subcategory,
      kind,
      tag: subcategoryLabel(subcategory),
      width,
      height,
      depth,
      color: p[color] || color,
      accent: p[accent] || accent,
      material,
      ...rest,
    });
  }
  // The original eight IDs remain intact so existing saved designs still open.
  add("cafe-table", "Orbit café table", "cafe-tables", "table", 80, 74, 80, {
    shape: "round",
    tag: "Pedestal · round top",
    aliases: ["round table", "cafe table"],
  });
  add("lounge-chair", "Cove lounge chair", "home-living", "chair", 72, 80, 76, {
    color: "sage",
    accent: "walnut",
    material: "matte",
    tag: "Low seat · solid frame",
    aliases: ["armchair"],
  });
  add("floor-lamp", "Halo floor lamp", "home-lighting", "lamp", 50, 160, 50, {
    color: "cream",
    material: "matte",
    tag: "Tapered shade · slim stem",
  });
  add(
    "work-desk",
    "Line work desk",
    "office-workstations",
    "desk",
    140,
    74,
    70,
    { shape: "square", tag: "Open frame · soft edges" },
  );
  add("bookshelf", "Grid bookshelf", "office-storage", "shelf", 90, 180, 35, {
    shelves: 4,
    tag: "Adjustable shelving",
  });
  add("bar-stool", "Perch bar stool", "cafe-tables", "stool", 42, 76, 42, {
    shape: "round",
    color: "walnut",
    material: "walnut",
    tag: "Round seat · four legs",
  });
  add(
    "display-plinth",
    "Forma display plinth",
    "shop-products",
    "plinth",
    55,
    90,
    55,
    {
      shape: "square",
      color: "cream",
      material: "matte",
      tag: "Sculptural product display",
    },
  );
  add(
    "display-rack",
    "Frame display rack",
    "shop-products",
    "rack",
    100,
    150,
    45,
    { shelves: 3, tag: "Open display · three tiers" },
  );
  // HOME — six subcategories, twenty-seven objects.
  add("sofa", "Studio sofa", "home-living", "sofa", 210, 82, 90, {
    color: "sage",
    accent: "walnut",
    material: "matte",
  });
  add("coffee-table", "Low coffee table", "home-living", "desk", 110, 42, 60, {
    shape: "square",
  });
  add("side-table", "Round side table", "home-living", "table", 45, 52, 45, {
    shape: "round",
    color: "walnut",
    material: "walnut",
  });
  add("tv-unit", "Media TV unit", "home-living", "cabinet", 160, 52, 42, {
    variant: "media",
    panels: 3,
  });
  add("bed-frame", "Platform bed frame", "home-bedroom", "bed", 160, 95, 210, {
    color: "oak",
    accent: "cream",
  });
  add("bedside-table", "Bedside table", "home-bedroom", "cabinet", 45, 55, 38, {
    variant: "drawers",
    panels: 2,
  });
  add("wardrobe", "Tall wardrobe", "home-bedroom", "cabinet", 120, 210, 60, {
    panels: 3,
  });
  add(
    "dressing-table",
    "Dressing table",
    "home-bedroom",
    "vanity",
    110,
    145,
    45,
    { accent: "walnut" },
  );
  add(
    "dining-table",
    "Family dining table",
    "home-dining",
    "desk",
    180,
    76,
    90,
    { shape: "square" },
  );
  add("dining-chair", "Dining chair", "home-dining", "chair", 48, 88, 52, {
    variant: "armless",
    color: "cream",
    accent: "oak",
    material: "matte",
  });
  add(
    "kitchen-island",
    "Kitchen island",
    "home-dining",
    "counter",
    160,
    95,
    80,
    { color: "cream", accent: "walnut", material: "matte" },
  );
  add(
    "breakfast-stool",
    "Breakfast stool",
    "home-dining",
    "stool",
    40,
    65,
    40,
    { shape: "square" },
  );
  add("table-lamp", "Cone table lamp", "home-lighting", "lamp", 30, 52, 30, {
    color: "cream",
    accent: "gold",
    material: "matte",
  });
  add(
    "pendant-light",
    "Dome pendant light",
    "home-lighting",
    "pendant",
    45,
    90,
    45,
    { color: "terracotta", material: "matte" },
  );
  add(
    "chandelier",
    "Branch chandelier",
    "home-lighting",
    "chandelier",
    90,
    80,
    90,
    { color: "cream", accent: "gold", material: "matte" },
  );
  add("wall-lamp", "Wall lamp", "home-lighting", "wall-light", 25, 45, 25, {
    color: "cream",
    accent: "gold",
    material: "matte",
  });
  add("vase", "Contour vase", "home-decoration", "vase", 24, 40, 24, {
    color: "terracotta",
    material: "matte",
  });
  add("planter", "Indoor planter", "home-decoration", "planter", 38, 70, 38, {
    color: "cream",
    accent: "sage",
    material: "matte",
  });
  add("mirror", "Wall mirror", "home-decoration", "mirror", 65, 95, 5, {
    accent: "gold",
    color: "silver",
    material: "metal",
  });
  add(
    "wall-shelf",
    "Floating wall shelf",
    "home-decoration",
    "wall-shelf",
    100,
    28,
    25,
  );
  add(
    "decorative-sculpture",
    "Stacked sculpture",
    "home-decoration",
    "sculpture",
    30,
    55,
    30,
    { color: "cream", accent: "terracotta", material: "matte" },
  );
  add("garden-bench", "Garden bench", "home-outdoor", "bench", 150, 85, 60, {
    variant: "backrest",
  });
  add("patio-table", "Patio table", "home-outdoor", "desk", 100, 74, 70, {
    shape: "square",
    variant: "slatted",
  });
  add("outdoor-chair", "Outdoor chair", "home-outdoor", "chair", 60, 85, 65, {
    variant: "slatted",
    color: "oak",
  });
  add(
    "plant-stand",
    "Tiered plant stand",
    "home-outdoor",
    "plant-stand",
    60,
    85,
    40,
    { color: "walnut", material: "walnut" },
  );
  // OFFICE — four subcategories, sixteen objects.
  add(
    "standing-desk",
    "Standing desk",
    "office-workstations",
    "desk",
    140,
    110,
    70,
    { shape: "square", variant: "standing" },
  );
  add(
    "corner-desk",
    "L-shaped corner desk",
    "office-workstations",
    "desk",
    160,
    75,
    130,
    { variant: "corner" },
  );
  add(
    "workstation-partition",
    "Workstation partition",
    "office-workstations",
    "partition",
    140,
    120,
    10,
    { variant: "solid", color: "sage", material: "matte" },
  );
  add(
    "office-chair",
    "Task office chair",
    "office-seating",
    "office-chair",
    65,
    115,
    65,
    { color: "black", accent: "silver", material: "matte" },
  );
  add("visitor-chair", "Visitor chair", "office-seating", "chair", 55, 85, 58, {
    variant: "armless",
    color: "blue",
    material: "matte",
  });
  add(
    "reception-sofa",
    "Reception sofa",
    "office-seating",
    "sofa",
    180,
    78,
    80,
    { color: "beige", material: "matte" },
  );
  add("meeting-chair", "Meeting chair", "office-seating", "chair", 58, 88, 60, {
    color: "navy",
    material: "matte",
  });
  add(
    "filing-cabinet",
    "Filing cabinet",
    "office-storage",
    "cabinet",
    46,
    115,
    60,
    { variant: "drawers", panels: 4, color: "grey", material: "metal" },
  );
  add(
    "drawer-unit",
    "Desk drawer unit",
    "office-storage",
    "cabinet",
    45,
    62,
    50,
    { variant: "drawers", panels: 3, color: "white", material: "matte" },
  );
  add(
    "storage-locker",
    "Storage locker",
    "office-storage",
    "cabinet",
    80,
    180,
    45,
    { variant: "locker", panels: 2, color: "sage", material: "metal" },
  );
  add(
    "conference-table",
    "Conference table",
    "office-shared",
    "desk",
    240,
    75,
    110,
    { shape: "square", color: "walnut", material: "walnut" },
  );
  add(
    "reception-desk",
    "Reception desk",
    "office-shared",
    "counter",
    180,
    110,
    70,
    { color: "cream", accent: "oak", material: "matte" },
  );
  add(
    "whiteboard-stand",
    "Whiteboard stand",
    "office-shared",
    "board",
    150,
    180,
    55,
    { color: "white", accent: "silver", material: "matte" },
  );
  add(
    "laptop-stand",
    "Laptop stand",
    "office-shared",
    "laptop-stand",
    35,
    25,
    30,
    { color: "silver", material: "metal" },
  );
  // CAFÉ — three subcategories, thirteen objects.
  add(
    "square-cafe-table",
    "Square café table",
    "cafe-tables",
    "table",
    75,
    74,
    75,
    { shape: "square", aliases: ["square table"] },
  );
  add("communal-table", "Communal table", "cafe-tables", "desk", 220, 76, 90, {
    shape: "square",
  });
  add("cafe-bench", "Café bench", "cafe-tables", "bench", 140, 46, 40, {
    aliases: ["bench"],
  });
  add(
    "service-counter",
    "Service counter",
    "cafe-counters",
    "counter",
    180,
    105,
    65,
    { color: "walnut", material: "walnut" },
  );
  add("bar-counter", "Bar counter", "cafe-counters", "counter", 200, 110, 55, {
    color: "black",
    accent: "walnut",
    material: "matte",
  });
  add(
    "pastry-display-stand",
    "Pastry display stand",
    "cafe-counters",
    "tier-stand",
    75,
    70,
    40,
    { shelves: 3 },
  );
  add("menu-stand", "Menu stand", "cafe-counters", "board", 50, 110, 50, {
    variant: "a-frame",
    color: "black",
    accent: "oak",
    material: "matte",
  });
  add(
    "pendant-lamp",
    "Café pendant lamp",
    "cafe-decor",
    "pendant",
    40,
    100,
    40,
    { color: "sage", material: "matte" },
  );
  add(
    "hanging-planter",
    "Hanging planter",
    "cafe-decor",
    "hanging-planter",
    35,
    95,
    35,
    { color: "terracotta", accent: "sage", material: "matte" },
  );
  add("wall-light", "Café wall light", "cafe-decor", "wall-light", 28, 45, 28, {
    color: "cream",
    accent: "black",
    material: "matte",
  });
  add(
    "decorative-partition",
    "Slatted decorative partition",
    "cafe-decor",
    "partition",
    120,
    180,
    18,
    { variant: "slatted" },
  );
  // SHOP — four subcategories, sixteen objects.
  add(
    "wall-shelving",
    "Retail wall shelving",
    "shop-products",
    "shelf",
    100,
    180,
    30,
    { shelves: 5 },
  );
  add(
    "product-pedestal",
    "Product pedestal",
    "shop-products",
    "plinth",
    40,
    100,
    40,
    { shape: "round", color: "terracotta", material: "matte" },
  );
  add("garment-rail", "Garment rail", "shop-clothing", "rail", 120, 165, 50, {
    color: "silver",
    accent: "black",
    material: "metal",
  });
  add(
    "hanging-rack",
    "Hanging clothes rack",
    "shop-clothing",
    "rail",
    100,
    170,
    45,
    { variant: "shelf", color: "oak" },
  );
  add("shoe-rack", "Shoe rack", "shop-clothing", "rack", 90, 95, 35, {
    shelves: 4,
  });
  add(
    "accessory-stand",
    "Accessory stand",
    "shop-clothing",
    "accessory",
    45,
    65,
    30,
    { color: "gold", material: "metal" },
  );
  add(
    "checkout-counter",
    "Checkout counter",
    "shop-fixtures",
    "counter",
    140,
    100,
    65,
    { color: "white", accent: "walnut", material: "matte" },
  );
  add(
    "display-cabinet",
    "Display cabinet",
    "shop-fixtures",
    "cabinet",
    100,
    170,
    45,
    { variant: "open", shelves: 4 },
  );
  add(
    "fitting-room-partition",
    "Fitting-room partition",
    "shop-fixtures",
    "partition",
    140,
    200,
    30,
    { variant: "corner", color: "cream", material: "matte" },
  );
  add(
    "mirror-stand",
    "Freestanding mirror stand",
    "shop-fixtures",
    "mirror",
    60,
    165,
    45,
    { variant: "standing", color: "silver", accent: "oak", material: "metal" },
  );
  add("signboard", "Shop signboard", "shop-signs", "board", 80, 150, 55, {
    variant: "a-frame",
    color: "sage",
    accent: "oak",
    material: "matte",
  });
  add(
    "brochure-holder",
    "Brochure holder",
    "shop-signs",
    "brochure",
    45,
    120,
    40,
    { color: "cream", accent: "black", material: "matte" },
  );
  add(
    "promotional-stand",
    "Promotional display stand",
    "shop-signs",
    "promo",
    65,
    170,
    45,
    { color: "sage", accent: "cream", material: "matte" },
  );
  add(
    "freestanding-logo-display",
    "Freestanding logo display",
    "shop-signs",
    "logo",
    60,
    110,
    35,
    { color: "terracotta", accent: "black", material: "matte" },
  );
  return items;
}
