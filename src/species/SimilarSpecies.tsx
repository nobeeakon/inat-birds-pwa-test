import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useSpeciesData } from "@/BirdDataContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { getCachedPhotoUrl } from "@/utils";
import type { SpeciesData } from "@/species/useFetchSpecies";

// The candidate rows load a photo each, so the untargeted list stays short and the
// search is what reaches the rest of a location's species
const MAX_VISIBLE_CANDIDATES = 20;

/**
 * The species that can be confused with this one, plus a dialog to pick them.
 *
 * Candidates come from the species list of the current location only: a bird from
 * somewhere else is not what the user has to tell this one apart from. Links are
 * stored on both species, so the pair reads the same from either card.
 *
 * This lives on the species page rather than being shared with the observations page
 * because comparing photos is what the picking is about, and only this page shows the
 * whole location side by side.
 */
const SimilarSpecies = ({ species }: { species: SpeciesData }) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const speciesInfoContext = useSpeciesInfoContext();
  const locationSpecies = useSpeciesData().species ?? [];

  const currentTaxonId = species.taxon.id.toString();
  const currentSpeciesInfo = speciesInfoContext.getSpeciesInfo(currentTaxonId);
  const similarSpeciesIds = currentSpeciesInfo?.similarSpeciesIds ?? [];

  // The name is stored alongside every link, so a species dropped from the location
  // list still has something to label its chip with
  const getSimilarSpeciesName = (similarTaxonId: string) =>
    speciesInfoContext.getSpeciesInfo(similarTaxonId)?.speciesName ??
    similarTaxonId;

  /**
   * Adds or removes the link on both species. The other side is written second, from
   * the value read before the first write: the two records are independent, so the
   * reload the first update triggers cannot make this read stale.
   */
  const setSimilarSpeciesLink = async (
    otherTaxonId: string,
    otherSpeciesName: string | undefined,
    shouldLink: boolean
  ) => {
    const addId = (taxonIds: string[], idToAdd: string) =>
      taxonIds.includes(idToAdd) ? taxonIds : [...taxonIds, idToAdd];
    const removeId = (taxonIds: string[], idToRemove: string) =>
      taxonIds.filter((taxonId) => taxonId !== idToRemove);

    await speciesInfoContext.updateSpeciesInfo(currentTaxonId, {
      ...currentSpeciesInfo,
      taxonId: currentTaxonId,
      speciesName: species.taxon.name,
      similarSpeciesIds: shouldLink
        ? addId(similarSpeciesIds, otherTaxonId)
        : removeId(similarSpeciesIds, otherTaxonId),
    });

    const otherSpeciesInfo = speciesInfoContext.getSpeciesInfo(otherTaxonId);
    const otherSimilarSpeciesIds = otherSpeciesInfo?.similarSpeciesIds ?? [];

    await speciesInfoContext.updateSpeciesInfo(otherTaxonId, {
      ...otherSpeciesInfo,
      taxonId: otherTaxonId,
      speciesName: otherSpeciesName ?? otherSpeciesInfo?.speciesName,
      similarSpeciesIds: shouldLink
        ? addId(otherSimilarSpeciesIds, currentTaxonId)
        : removeId(otherSimilarSpeciesIds, currentTaxonId),
    });
  };

  const lowerSearchTerm = searchTerm.toLowerCase().trim();

  const matchesSearch = (candidate: SpeciesData) =>
    !lowerSearchTerm ||
    candidate.taxon.name.toLowerCase().includes(lowerSearchTerm) ||
    !!candidate.taxon.preferred_common_name
      ?.toLowerCase()
      .includes(lowerSearchTerm);

  // Only walked while the dialog is open: every card on the page mounts one of these,
  // and the location list runs into the hundreds of species
  const matchingCandidates = isDialogOpen
    ? locationSpecies.filter(
        (candidate) =>
          candidate.taxon.id !== species.taxon.id && matchesSearch(candidate)
      )
    : [];

  const visibleCandidates = matchingCandidates.slice(0, MAX_VISIBLE_CANDIDATES);
  const hiddenCandidateCount =
    matchingCandidates.length - visibleCandidates.length;

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        {similarSpeciesIds.map((similarTaxonId) => (
          <Chip
            key={similarTaxonId}
            label={getSimilarSpeciesName(similarTaxonId)}
            size="small"
          />
        ))}
        <Button size="small" onClick={() => setIsDialogOpen(true)}>
          {t("similarSpecies")}
        </Button>
      </Stack>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("similarSpecies")}</DialogTitle>
        <DialogContent>
          {/* The species being edited stays in view so its photo can be compared
              against the candidates while scrolling through them */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              variant="rounded"
              src={getCachedPhotoUrl(species.taxon.default_photo?.square_url)}
              alt={species.taxon.name}
              sx={{ width: 64, height: 64 }}
            />
            <Box>
              <Typography variant="subtitle2">{species.taxon.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {species.taxon.preferred_common_name}
              </Typography>
            </Box>
          </Stack>

          {similarSpeciesIds.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
              {similarSpeciesIds.map((similarTaxonId) => (
                <Chip
                  key={similarTaxonId}
                  label={getSimilarSpeciesName(similarTaxonId)}
                  onDelete={() =>
                    setSimilarSpeciesLink(similarTaxonId, undefined, false)
                  }
                  color="primary"
                />
              ))}
            </Box>
          )}

          <TextField
            label={t("search")}
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" component="p">
            {t("similarSpeciesLocationHint")}
          </Typography>

          {matchingCandidates.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t("noSpeciesMatch")}
            </Typography>
          ) : (
            <List dense disablePadding>
              {visibleCandidates.map((candidate) => {
                const candidateTaxonId = candidate.taxon.id.toString();
                const isLinked = similarSpeciesIds.includes(candidateTaxonId);

                return (
                  <ListItemButton
                    key={candidateTaxonId}
                    onClick={() =>
                      setSimilarSpeciesLink(
                        candidateTaxonId,
                        candidate.taxon.name,
                        !isLinked
                      )
                    }
                    selected={isLinked}
                  >
                    <ListItemAvatar>
                      <Avatar
                        variant="rounded"
                        src={getCachedPhotoUrl(
                          candidate.taxon.default_photo?.square_url
                        )}
                        alt={candidate.taxon.name}
                        sx={{ width: 56, height: 56, mr: 1 }}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={candidate.taxon.name}
                      secondary={candidate.taxon.preferred_common_name}
                    />
                    <Checkbox edge="end" checked={isLinked} tabIndex={-1} />
                  </ListItemButton>
                );
              })}
            </List>
          )}

          {hiddenCandidateCount > 0 && (
            <Typography variant="caption" color="text.secondary" component="p">
              {t("moreSpeciesMatch", { count: hiddenCandidateCount })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>{t("done")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimilarSpecies;
