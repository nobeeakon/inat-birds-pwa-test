export const notNullish = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const getRandomIndex = (length: number) =>
  Math.floor(Math.random() * length);

const SPECIES_URL = ({
  lat,
  lng,
  radius,
  perPage = 50,
  page = 0,
}: {
  lat: number;
  lng: number;
  radius: number;
  perPage?: number;
  page?: number;
}) =>
  `https://api.inaturalist.org/v2/observations/species_counts?verifiable=true&spam=false&lat=${lat}&lng=${lng}&radius=${radius}&iconic_taxa%5B%5D=Aves&locale=es-MX&preferred_place_id=6793&page=${page}&per_page=${perPage}&include_ancestors=true&fields=(taxon%3A(ancestor_ids%3A!t%2Cancestors%3A(default_photo%3A(square_url%3A!t)%2Ciconic_taxon_name%3A!t%2Cid%3A!t%2Cis_active%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t%2Cuuid%3A!t)%2Cancestry%3A!t%2Cconservation_status%3A(status%3A!t)%2Cdefault_photo%3A(attribution%3A!t%2Clicense_code%3A!t%2Cmedium_url%3A!t%2Csquare_url%3A!t%2Curl%3A!t)%2Cestablishment_means%3A(establishment_means%3A!t)%2Ciconic_taxon_name%3A!t%2Cid%3A!t%2Cis_active%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t))`;

const OBSERVATIONS_URL = ({
  lat,
  lng,
  radius,
  page = 0,
}: {
  lat: number;
  lng: number;
  radius: number;
  page?: number;
}) =>
  `https://api.inaturalist.org/v2/observations?verifiable=true&order_by=id&order=desc&page=${page}&spam=false&lat=${lat}&lng=${lng}&radius=${radius}&locale=es-MX&preferred_place_id=6793&iconic_taxa%5B%5D=Aves&per_page=24&no_total_hits=true&fields=(comments_count%3A!t%2Ccreated_at%3A!t%2Ccreated_at_details%3Aall%2Ccreated_time_zone%3A!t%2Cfaves_count%3A!t%2Cgeoprivacy%3A!t%2Cid%3A!t%2Cidentifications%3A(current%3A!t)%2Cidentifications_count%3A!t%2Clocation%3A!t%2Cmappable%3A!t%2Cobscured%3A!t%2Cobserved_on%3A!t%2Cobserved_on_details%3Aall%2Cobserved_time_zone%3A!t%2Cphotos%3A(id%3A!t%2Curl%3A!t)%2Cplace_guess%3A!t%2Cprivate_geojson%3A!t%2Cquality_grade%3A!t%2Csounds%3A(id%3A!t)%2Cspecies_guess%3A!t%2Ctaxon%3A(iconic_taxon_id%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t)%2Ctime_observed_at%3A!t%2Cuser%3A(icon_url%3A!t%2Cid%3A!t%2Clogin%3A!t))`;

export const getObservationsUrlForTaxon = ({
  lat,
  lng,
  radius,
  taxonId,
  perPage = 10,
  page = 0,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxonId: number;
  perPage?: number;
  page?: number;
}) =>
  `https://api.inaturalist.org/v2/observations?verifiable=true&order_by=id&order=desc&page=${page}&spam=false&lat=${lat}&lng=${lng}&radius=${radius}&taxon_id=${taxonId}&locale=es-MX&preferred_place_id=6793&iconic_taxa%5B%5D=Aves&per_page=${perPage}&no_total_hits=true&fields=(comments_count%3A!t%2Ccreated_at%3A!t%2Ccreated_at_details%3Aall%2Ccreated_time_zone%3A!t%2Cfaves_count%3A!t%2Cgeoprivacy%3A!t%2Cid%3A!t%2Cidentifications%3A(current%3A!t)%2Cidentifications_count%3A!t%2Clocation%3A!t%2Cmappable%3A!t%2Cobscured%3A!t%2Cobserved_on%3A!t%2Cobserved_on_details%3Aall%2Cobserved_time_zone%3A!t%2Cphotos%3A(id%3A!t%2Curl%3A!t)%2Cplace_guess%3A!t%2Cprivate_geojson%3A!t%2Cquality_grade%3A!t%2Csounds%3A(id%3A!t)%2Cspecies_guess%3A!t%2Ctaxon%3A(iconic_taxon_id%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t)%2Ctime_observed_at%3A!t%2Cuser%3A(icon_url%3A!t%2Cid%3A!t%2Clogin%3A!t))`;

// TODO use this one
export const getUrl = ({
  type,
  lat,
  lng,
  radius,
  perPage,
  page,
}: {
  type: "species" | "observations";
  lat: number;
  lng: number;
  radius: number;
  perPage?: number;
  page?: number;
}) => {
  if (type === "species") {
    return SPECIES_URL({ lat, lng, radius, perPage, page });
  }
  if (type === "observations") {
    return OBSERVATIONS_URL({ lat, lng, radius, page });
  }

  return "";
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
