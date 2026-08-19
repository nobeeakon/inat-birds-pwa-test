import { Box, Typography } from "@mui/material";

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
  /** Position in the species list, shown before the name when the list is unfiltered. */
  index?: number;
  /** Enlarges the name on small screens, for cards where it is the answer being revealed. */
  prominentName?: boolean;
  /** Nullish entries are dropped, so callers can pass optional fields directly. */
  details: (string | null | undefined)[];
}) => {
  const visibleDetails = details.filter(Boolean);

  return (
    <Box>
      <Typography
        component="p"
        sx={prominentName ? { fontSize: { xs: "1.4rem", sm: "1rem" } } : {}}
      >
        <strong>
          {index != null && `${index}. `}
          <a
            href={`https://mexico.inaturalist.org/taxa/${taxonId}`}
            target="blank"
          >
            {scientificName}
          </a>
        </strong>
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
