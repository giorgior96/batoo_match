export interface BoatImage {
    ImageUrl: string;
    Text?: string;
}

export interface BoatEngine {
    Text?: string;
    Builder?: string;
    Model?: string;
    Qty?: number;
    HP?: number;
    HPFiscal?: number;
    EngineTypes?: number;
    EngineTypesText?: string;
    IDTransmission?: number;
    Transmission?: string;
    YearBuilt?: number;
    Hours?: number;
    Revision?: string;
}

export interface BoatFamily {
    ID?: number;
    Text?: string;
}

export interface Boat {
    // Core identification
    BoatID: string;
    BoatType?: string;
    Code?: number;
    IDGroup?: string;
    AgencyEmail?: string;

    // Dates
    InsDate?: string;
    UpdDate?: string;

    // Basic info
    Builder: string;
    Model: string;
    YearBuilt: number;
    Length?: number;
    Engine?: string;
    BoatFamilies?: string;

    // Extended measurements
    Beam?: number;
    Draft?: number;
    DraftMin?: number;
    DraftMax?: number;
    Displacement?: number;
    LightDisplacement?: number;
    Tonnage?: number;
    MaxPeople?: number;

    // Performance
    SpeedMax?: number;
    SpeedCruise?: number;
    Range?: number;

    // Capacities
    Fuel?: number;
    Water?: number;
    Wastewater?: number;
    Consumption?: number;

    // Generator
    Generator?: string;

    // Location
    Country?: string;
    CountryISOCode?: string;
    NavigationZone?: string;
    Harbor?: string;
    VisibleAt?: string;
    VisibleAddress?: string;
    City?: string; // For compatibility

    // Accommodation
    Cabins?: number;
    Baths?: number;
    AccommodationsCabins?: number;

    // Status flags
    New?: boolean;
    Stock?: boolean;
    Highlighted?: boolean;
    PendingSale?: boolean;
    Sold?: boolean;
    ReservedPrice?: boolean;
    ProfUse?: boolean;
    Vintage?: boolean;
    Watercraft?: boolean;

    // Sale price
    Sale?: boolean;
    SellPrice: number;
    SellPriceFormatted?: string;
    SellPriceCurrency: string;
    SellPriceVAT?: string;
    SellPriceNotes?: string;
    SellPriceReduced?: boolean;
    SellPriceReducedDate?: string;
    OldSellPrice?: number;
    OldSellPriceFormatted?: string;
    OldSellPriceCurrency?: string;

    // Charter
    Charter?: boolean;
    CharterPrice?: number;
    CharterPriceFormatted?: string;
    CharterPriceCurrency?: string;
    CharterPriceVAT?: string;
    CharterPriceNotes?: string;

    // Assignment
    RequestedAssignmentPrice?: number;
    RequestedAssignmentPriceFormatted?: string;
    RequestedAssignmentPriceCurrency?: string;
    RequestedAssignmentVAT?: string;
    RequestedAssignmentNotes?: string;

    // Media
    ImageUrl?: string;
    ImagesList?: BoatImage[]; // For compatibility
    ImagesHQ?: boolean;
    Images360?: boolean;
    Video?: boolean;

    // Web presence
    WebNotes?: string;
    Web?: boolean;
    W2?: boolean;
    W3?: boolean;
    W4?: boolean;
    W5?: boolean;
    W6?: boolean;
    W7?: boolean;
    W8?: boolean;
    W9?: boolean;
    Evi?: boolean;
    Vet?: boolean;
    App?: boolean;

    // Materials
    HullMaterial?: string;
    DeckMaterial?: string;
    SuperstructureMaterial?: string;

    // Lists
    BoatFamiliesList?: BoatFamily[];
    EnginesList?: BoatEngine[];

    // Compatibility
    // Compatibility
    Specs?: string;

    // Detailed Images
    Images?: BoatImage[];
}

export interface BoatResponse {
    Results: Boat[];
    TotalResults: number;
}
