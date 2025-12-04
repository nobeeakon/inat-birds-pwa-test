export const fetchData = (URL: string) =>
  fetch(URL, {
    credentials: "omit",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.5",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
    },
    referrer: "https://mexico.inaturalist.org/",
    method: "GET",
    mode: "cors",
  }).then((response) => response.json());
