import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { savedService } from '../services/saved.js';
import { useAuth } from './AuthContext.jsx';
import {
  extractSavedIds,
  isListingSaved,
  optimisticAddSaved,
  optimisticRemoveSaved,
} from '../utils/savedState.js';

const SavedContext = createContext(null);

export function SavedProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [savedListings, setSavedListings] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingIds, setSavingIds] = useState(new Set());
  const [mutationError, setMutationError] = useState(null);

  // Derived set of saved IDs for O(1) membership check
  const savedIds = useMemo(() => {
    return extractSavedIds(savedListings);
  }, [savedListings]);

  // Fetch saved listings from the verified GET /v1/saved endpoint
  const refreshSaved = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await savedService.getSaved();
      setSavedListings(data.results || []);
      setSavedCount(data.count ?? data.results?.length ?? 0);
    } catch (err) {
      console.warn('Failed to load saved listings:', err.message);
      setError(err.message || 'Failed to load saved listings');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Sync with auth status: load on sign-in, clear on logout
  useEffect(() => {
    if (isAuthenticated) {
      refreshSaved();
    } else {
      setSavedListings([]);
      setSavedCount(0);
      setError(null);
      setSavingIds(new Set());
      setMutationError(null);
    }
  }, [isAuthenticated, refreshSaved]);

  const isSaved = useCallback(
    (listingId) => isListingSaved(savedIds, listingId),
    [savedIds]
  );

  const isSaving = useCallback(
    (listingId) => {
      if (!listingId) return false;
      return savingIds.has(String(listingId));
    },
    [savingIds]
  );

  const clearMutationError = useCallback(() => {
    setMutationError(null);
  }, []);

  // Save listing with optimistic UI and error rollback
  const saveListing = useCallback(
    async (listingOrId) => {
      const listingId = typeof listingOrId === 'string'
        ? listingOrId
        : (listingOrId?.listing_id || listingOrId?.id);
      if (!listingId) return false;

      const strId = String(listingId);
      setSavingIds((prev) => new Set([...prev, strId]));
      setMutationError(null);

      // Snapshot previous state for rollback
      const previousListings = savedListings;
      const previousCount = savedCount;

      // Optimistic update
      const { listings: nextListings, count: nextCount } = optimisticAddSaved(savedListings, listingOrId);
      setSavedListings(nextListings);
      setSavedCount(nextCount);

      try {
        await savedService.saveListing(strId);
        // If only an ID was provided without details, refresh list in background
        if (typeof listingOrId === 'string' || !listingOrId.apartment_name) {
          savedService.getSaved().then((fresh) => {
            setSavedListings(fresh.results || []);
            setSavedCount(fresh.count ?? fresh.results?.length ?? 0);
          }).catch(() => {});
        }
        return true;
      } catch (err) {
        console.error('Save failed:', err);
        // Rollback state
        setSavedListings(previousListings);
        setSavedCount(previousCount);
        setMutationError(err.message || `Failed to save listing ${strId}`);
        throw err;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(strId);
          return next;
        });
      }
    },
    [savedListings, savedCount]
  );

  // Remove listing from saved with optimistic UI and error rollback
  const removeSavedListing = useCallback(
    async (listingId) => {
      if (!listingId) return false;

      const strId = String(listingId);
      setSavingIds((prev) => new Set([...prev, strId]));
      setMutationError(null);

      // Snapshot previous state for rollback
      const previousListings = savedListings;
      const previousCount = savedCount;

      // Optimistic update
      const { listings: nextListings, count: nextCount } = optimisticRemoveSaved(savedListings, strId);
      setSavedListings(nextListings);
      setSavedCount(nextCount);

      try {
        await savedService.removeListing(strId);
        return true;
      } catch (err) {
        console.error('Remove saved failed:', err);
        // Rollback state
        setSavedListings(previousListings);
        setSavedCount(previousCount);
        setMutationError(err.message || `Failed to remove listing ${strId}`);
        throw err;
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(strId);
          return next;
        });
      }
    },
    [savedListings, savedCount]
  );

  // Unified toggle helper
  const toggleSave = useCallback(
    async (listingOrId) => {
      const listingId = typeof listingOrId === 'string'
        ? listingOrId
        : (listingOrId?.listing_id || listingOrId?.id);
      if (!listingId) return false;

      const strId = String(listingId);
      if (savedIds.has(strId)) {
        return removeSavedListing(strId);
      } else {
        return saveListing(listingOrId);
      }
    },
    [savedIds, removeSavedListing, saveListing]
  );

  const value = useMemo(
    () => ({
      savedListings,
      savedCount,
      savedIds,
      isLoading,
      error,
      mutationError,
      clearMutationError,
      isSaved,
      isSaving,
      saveListing,
      removeSavedListing,
      toggleSave,
      refreshSaved,
    }),
    [
      savedListings,
      savedCount,
      savedIds,
      isLoading,
      error,
      mutationError,
      clearMutationError,
      isSaved,
      isSaving,
      saveListing,
      removeSavedListing,
      toggleSave,
      refreshSaved,
    ]
  );

  return (
    <SavedContext.Provider value={value}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) {
    throw new Error('useSaved must be used within a SavedProvider');
  }
  return context;
}
