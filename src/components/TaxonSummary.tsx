import { Box, Link, Typography } from "@mui/material";

import { INATURALIST_SITE_URL } from "@/constants";

/**
 * The heading shared by the observation and species cards: the scientific name on
 * its own line, with everything else about the taxon on a second, quieter line.
 *
 * Both cards go through here so a taxon reads the same wherever it appears — one
 * separator between details, rather than a mix of parentheses and brackets.
 */

const DETAIL_SEPARATOR = " · ";

const TaxonSummary = ({
  taxonId,
  scientificName,
  index,
  prominentName = false,
  details,
}: {
  taxonId: number;
  scientificName: string;
  /** Place in the full species list, shown before the name and kept while filtering. */
  index?: number;
  /** Enlarges the name on small screens, for cards where it is the answer being revealed. */
  prominentName?: boolean;
  /** Nullish entries are dropped, so callers can pass optional fields directly. */
  details: (string | null | undefined)[];
}) => {
  const visibleDetails = details.filter(Boolean);

  return (
    <Box>
      {/* Binomials are set in italics by convention, and the serif is the one place the
          app looks like the printed guide it stands in for */}
      <Typography
        component="p"
        sx={{
          fontFamily: (theme) => theme.typography.h6.fontFamily,
          fontStyle: "italic",
          fontWeight: 600,
          ...(prominentName
            ? { fontSize: { xs: "1.5rem", sm: "1.15rem" } }
            : {}),
        }}
      >
        {index != null && `${index}. `}
        <Link
          href={`${INATURALIST_SITE_URL}/taxa/${taxonId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {scientificName}
        </Link>
      </Typography>

      {visibleDetails.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          {visibleDetails.join(DETAIL_SEPARATOR)}
        </Typography>
      )}
    </Box>
  );
};

export default TaxonSummary;
