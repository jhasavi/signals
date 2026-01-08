export interface MLSListing {
  ListingId?: string;
  StandardStatus?: string;
  ListPrice?: number;
  Town?: string;
  City?: string;
  UnparsedAddress?: string;
  StreetNumber?: string;
  StreetName?: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  DaysOnMarket?: number;
  ListingContractDate?: string;
  PendingTimestamp?: string;
  CloseDate?: string;
  ClosePrice?: number;
  [key: string]: any;
}

export interface NormalizedListing {
  mls_id: string;
  property_type: 'SF' | 'CC' | 'MF';
  status: string;
  list_price: number | null;
  town: string;
  address: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  dom: number | null;
  list_date: string | null;
  pending_date: string | null;
  sold_date: string | null;
  sold_price: number | null;
  raw_data: any;
}
