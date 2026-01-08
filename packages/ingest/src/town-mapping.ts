// Mapping of TOWN_NUM codes to actual town names
// This is a Boston area MLS mapping
export const TOWN_NUM_MAP: Record<string, string> = {
  '1': 'Boston',
  '2': 'Belmont',
  '3': 'Beverly',
  '4': 'Braintree',
  '5': 'Burlington',
  '6': 'Canton',
  '7': 'Chelsea',
  '8': 'Cohasset',
  '9': 'Danvers',
  '10': 'Dedham',
  '11': 'Dorchester',
  '12': 'Cambridge',
  '13': 'Brookline',
  '14': 'Everett',
  '15': 'Framingham',
  '16': 'Lexington',
  '17': 'Lincoln',
  '18': 'Lynn',
  '19': 'Malden',
  '20': 'Medford',
  '21': 'Melrose',
  '22': 'Milton',
  '23': 'Natick',
  '25': 'Needham',
  '26': 'Newton',
  '28': 'Peabody',
  '29': 'Quincy',
  '31': 'Revere',
  '33': 'Salem',
  '34': 'Saugus',
  '35': 'Stoneham',
  '36': 'Swampscott',
  '37': 'Wakefield',
  '39': 'Somerville',
  '40': 'Waltham',
  '41': 'Watertown',
  '42': 'Wellesley',
  '43': 'Weston',
  '45': 'Weymouth',
  '46': 'Winchester',
  '48': 'Winthrop',
  '49': 'Woburn',
  '50': 'Abington',
  '51': 'Acton',
  '52': 'Arlington',
  '54': 'Bedford',
  '56': 'Billerica',
  '58': 'Boxborough',
  '60': 'Brockton',
  '62': 'Carlisle',
  '65': 'Chelmsford',
  '67': 'Concord',
  '68': 'Dover',
  '70': 'Duxbury',
  '101': 'Back Bay',
  '102': 'Beacon Hill',
  '103': 'Downtown Boston',
  '104': 'Fenway',
  '105': 'Fort Point',
  '106': 'Leather District',
  '107': 'North End',
  '108': 'Seaport',
  '109': 'South End',
  '110': 'Chinatown',
  '111': 'Bay Village',
  '112': 'West End',
  '113': 'Financial District',
  '114': 'Charlestown',
  '117': 'West Roxbury',
  '119': 'Roxbury',
  '152': 'Hyde Park',
  '156': 'Jamaica Plain',
  '157': 'Mission Hill',
  '161': 'Allston',
  '163': 'Brighton',
  '164': 'Chestnut Hill',
  '173': 'Roslindale',
  '175': 'Dorchester Lower Mills',
  '180': 'Dorchester Ashmont',
  '181': 'Dorchester Fields Corner',
  '182': 'Dorchester Uphams Corner',
  '183': 'Dorchester Savin Hill',
  '185': 'Brighton',
  '186': 'Allston Village',
  '187': 'Brighton Oak Square',
  '188': 'Dorchester Adams Village',
  '189': 'Dorchester Codman Square',
  '190': 'Dorchester Neponset',
  '192': 'Dorchester Four Corners',
  '193': 'Dorchester Meeting House Hill',
  '194': 'Dorchester Jones Hill',
  '195': 'South Boston',
  '196': 'South Boston Waterfront',
  '200': 'South Boston City Point',
  '202': 'South Boston Telegraph Hill',
  '205': 'Charlestown Navy Yard',
  '206': 'Charlestown Monument Square',
  '207': 'Roxbury Dudley',
  '209': 'Roxbury Fort Hill',
  '213': 'East Boston',
  '301': 'Marblehead',
  '302': 'Marshfield',
  '303': 'Medfield',
  '304': 'Medway',
  '305': 'Milford',
  '306': 'Millis',
  '307': 'Nahant',
  '311': 'Needham',
  '312': 'Newbury',
  '313': 'Newburyport',
  '315': 'Norfolk',
  '316': 'North Andover',
  '317': 'North Reading',
  '318': 'Norwood',
  '319': 'Pembroke',
  '320': 'Plymouth',
  '322': 'Randolph',
  '326': 'Rockland',
  '327': 'Rockport',
  '328': 'Rowley',
  '329': 'Salisbury',
  '342': 'Sharon',
  '343': 'Sherborn',
  '344': 'Southborough',
  '345': 'Stoughton',
  '346': 'Sudbury',
  '352': 'Walpole',
  '353': 'Wayland',
  '362': 'Westwood',
  '363': 'Whitman',
  '364': 'Wilmington',
  '365': 'Wrentham',
  '371': 'Norwood',
  '372': 'Mattapan',
  '373': 'Mattapan Cummins Highway',
  '376': 'West Roxbury Centre',
  '379': 'Hyde Park Cleary Square',
  '380': 'Hyde Park Fairmount',
  '401': 'Arlington',
  '402': 'Arlington Heights',
  '404': 'Belmont Center',
  '405': 'Belmont Hill',
  '406': 'Belmont Waverley',
  '408': 'Watertown',
  '409': 'Watertown Arsenal',
  '414': 'Waltham',
  '418': 'Waltham Prospect Hill',
  '420': 'Newton Centre',
  '421': 'Newton Chestnut Hill',
  '422': 'Newton Highlands',
  '423': 'Newton Lower Falls',
  '424': 'Newton Newton Corner',
  '426': 'Newton Newtonville',
  '427': 'Newton Nonantum',
  '428': 'Newton Oak Hill',
  '429': 'Newton Thompsonville',
  '430': 'Newton Upper Falls',
  '431': 'Newton Waban',
  '432': 'Newton West Newton',
  '433': 'Needham',
  '434': 'Needham Heights',
  '435': 'Needham Highlandville',
  '436': 'Wellesley',
  '437': 'Wellesley Farms',
  '438': 'Wellesley Hills',
  '441': 'Weston',
  '442': 'Lincoln',
  '443': 'Lexington',
  '444': 'Lexington East',
  '451': 'Concord',
  '453': 'Carlisle',
  '454': 'Bedford',
  '455': 'Winchester',
  '457': 'Woburn',
  '459': 'Reading',
  '460': 'Stoneham',
  '464': 'Wakefield',
  '465': 'Melrose',
  '466': 'Saugus',
  '468': 'Malden',
  '472': 'Medford',
  '473': 'Medford West',
  '505': 'Everett',
  '506': 'Chelsea',
  '507': 'Revere',
  '511': 'Winthrop',
  '517': 'Lynn',
  '523': 'Swampscott',
  '526': 'Marblehead',
  '527': 'Salem',
  '529': 'Beverly',
  '530': 'Peabody',
  '539': 'Danvers',
  '554': 'Topsfield',
  '555': 'Ipswich',
  '565': 'Andover',
  '570': 'North Andover',
  '832': 'Cambridge Central',
  '833': 'Cambridge Cambridgeport',
  '839': 'Watertown',
  '840': 'Cambridge East',
  '841': 'Cambridge Harvard Square',
  '842': 'Cambridge Inman Square',
  '843': 'Cambridge Mid Cambridge',
  '844': 'Cambridge North Cambridge',
  '845': 'Cambridge Riverside',
  '846': 'Cambridge West Cambridge',
  '849': 'Cambridge Porter Square',
  '850': 'Somerville Davis Square',
  '851': 'Somerville East',
  '855': 'Somerville Union Square',
  '856': 'Somerville West',
  '857': 'Somerville Winter Hill',
  '858': 'Somerville Spring Hill',
  '860': 'Medford Hillside',
  '862': 'Medford South',
  '865': 'Malden Faulkner',
  '866': 'Malden Linden',
  '868': 'Everett',
  '872': 'Brookline Coolidge Corner',
  '874': 'Brookline Reservoir',
  // Numeric codes that appear with leading zeros in quotes
  '002': 'Belmont',
  '003': 'Beverly',
  '004': 'Braintree',
  '005': 'Burlington',
  '006': 'Canton',
  '007': 'Chelsea',
  '008': 'Cohasset',
  '009': 'Danvers',
  '010': 'Dedham',
  '011': 'Dorchester',
  '018': 'Lynn',
  '019': 'Malden',
  '056': 'Billerica',
  '060': 'Brockton',
};

/**
 * Extract town name from available fields
 * Prioritizes: explicit TOWN field > NEIGHBORHOOD > AREA > mapped TOWN_NUM code
 */
export function extractTownName(listing: any): string {
  // Try explicit town field first
  let town = (listing.Town || listing.TOWN || '').trim();
  // Remove quotes if present
  town = town.replace(/^"(.*)"$/, '$1');
  if (town && !town.match(/^\d+$/)) {
    return town;
  }

  // Try neighborhood field
  town = (listing.Neighborhood || listing.NEIGHBORHOOD || '').trim();
  town = town.replace(/^"(.*)"$/, '$1');
  if (town && !town.match(/^\d+$/)) {
    return town;
  }

  // Try area field
  town = (listing.Area || listing.AREA || '').trim();
  town = town.replace(/^"(.*)"$/, '$1');
  if (town && !town.match(/^\d+$/)) {
    return town;
  }

  // Try mapping TOWN_NUM code
  let townNum = (listing.TOWN_NUM || listing.TownNum || '').trim();
  // Remove quotes if present
  townNum = townNum.replace(/^"(.*)"$/, '$1');

  if (townNum && TOWN_NUM_MAP[townNum]) {
    return TOWN_NUM_MAP[townNum];
  }

  // If TOWN_NUM exists but not in map, log it for debugging (only once per code)
  if (townNum && townNum.match(/^\d+$/)) {
    // Only log in first few instances
    if (Math.random() < 0.01) {
      // 1% sampling to avoid spam
      console.warn(
        `  ⚠️  Unknown TOWN_NUM code: ${townNum} (listing: ${listing.ListingId || listing.LIST_NO})`
      );
    }
  }

  return townNum || 'Unknown';
}

/**
 * Extract DOM (Days on Market) from available fields or compute from list_date
 */
export function extractDOM(listing: any, today: Date = new Date()): number | null {
  // Try DOM field first
  const dom = parseInt(listing.DaysOnMarket || listing.DOM || listing.DAYS_ON_MARKET || '', 10);
  if (!isNaN(dom) && dom > 0) {
    return dom;
  }

  // Try computing from list_date
  const listDate =
    listing.ListingContractDate ||
    listing.LIST_DATE ||
    listing.LISTING_DATE ||
    listing.LIST_OPEN_DATE;

  if (listDate) {
    try {
      const date = new Date(listDate);
      if (!isNaN(date.getTime())) {
        const diffMs = today.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          return diffDays;
        }
      }
    } catch (err) {
      // Ignore parse errors
    }
  }

  return null;
}
