import { useState, useEffect } from "react";

export type ObservationType = {
      "uuid": string,
      "comments_count": number,
      "created_at": string,
      "created_at_details": {
        "date": string,
        "day": number,
        "hour": number,
        "month": number,
        "week": number,
        "year": number
      },
      "created_time_zone": string,
      "faves_count": number,
      "geoprivacy"?: null|boolean,
      "id": number,
      "identifications": 
        {
          "id": number,
          "current": boolean
        }[];
      "identifications_count": number,
      "location": `${number},${number}`,
      "mappable": boolean,
      "obscured": boolean,
      "observed_on": string,
      "observed_on_details": {
        "date": string,
        "day": number,
        "hour": number,
        "month": number,
        "week": number,
        "year": number
      },
      "observed_time_zone": string,
      "photos":   {
          "id": number,
          "url": string
        }[];
      "place_guess": string,
      "quality_grade": string,
      "sounds": [],
      "taxon": {
        "id": number,
        "iconic_taxon_id": number,
        "name": string,
        "preferred_common_name": string,
        "rank": string,
        "rank_level": number
      },
      "time_observed_at": string,
      "user": {
        "id": number,
        "icon_url": string,
        "login": string
      }
    }


type ResponseType = {
 "total_results": number;
  "page": number;
  "per_page": number;
    results: ObservationType[]
}

const getData =  (URL : string) =>  fetch(URL, {
    "credentials": "omit",
    "headers": {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site"
    },
    "referrer": "https://mexico.inaturalist.org/",
    "method": "GET",
    "mode": "cors"
}).then(response => response.json());




const parseURLWithDate = (url: string, page: number) => {
    // example URL

    console.log('hola ', url, 'with page:', page);
    const newUrl = new URL(url);
    newUrl.searchParams.set("page", page.toString());
    return newUrl.toString();
}


// const useFetchData = (url:string) => {
//     const [query, setQuery] = useState<{loading: boolean, data: unknown, error: boolean|null}>({loading: false, data: null, error: null});

//     const fetcher = async (page: number) => {
//         setQuery({loading: true, data: null, error: null});
//         try {
//             const data = await getData(parseURLWithDate(url, page   ));
//             setQuery({loading: false, data: data, error: null});
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         } catch (_error) {
//             setQuery({loading: false, data: null, error: true});
//         }
//     }
//     return {query, fetcher};
// }



export const useFetchDataPages = (url:string, numberOfPages: number = 10) => {
    const [queries, setQueries] = useState<{loading: boolean, data: null|ObservationType[], error: boolean|null}>({loading: false, data: null, error: null});

    useEffect(()    => {
        
        const fetchPagesData = async () => {
            if(!url) {
                setQueries({loading: false, data: null, error: null});
            }

            const queries = Array(numberOfPages).fill(null).map((_, page) => getData(parseURLWithDate(url, page   )));

            setQueries({loading: true, data: null, error: null});
            try {
                const data = await Promise.all<ResponseType>(queries);

                const items = data.map(dataItem => dataItem.results).flat().filter(observation => observation.quality_grade === 'research' && observation.photos.length > 0);


                setQueries({loading: false, data: items, error: null});
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_error) {
                setQueries({loading: false, data: null, error: true});
            }
        }

        fetchPagesData();

    }, [numberOfPages, url])


    return queries;
}

