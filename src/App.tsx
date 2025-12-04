import "./App.css";

import LatestObservationsPage from "@/latest-observations/LatestObservationsPage";
import SpeciesPage from "@/species/SpeciesPage";
import { useState } from "react";

const App = () => {
  const [page, setPage] = useState<"observations" | "species">("species");

  return (
    <div>
      {/* <div className={page === "observations" ? "" : "hidden"}> */}
      <LatestObservationsPage onShowSpecies={() => setPage("species")} />
      {/* </div> */}
      {/* <div className={page === "species" ? "" : "hidden"}>
        <SpeciesPage onShowLatestObservations={() => setPage("observations")} />
      </div> */}
    </div>
  );
};

export default App;
