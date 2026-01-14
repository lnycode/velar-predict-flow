/**
 * Geocoding Service
 * 
 * Handles location name to coordinates conversion via Edge Function.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Result, GeocodingResult } from '@/domain/types';

const GEOCODE_FUNCTION_URL = 'https://jnxdnbttrgodpyyqoaqu.supabase.co/functions/v1/geocode-location';

/**
 * Geocode a location name to coordinates
 * Returns an array of matching locations with lat/lng
 */
export async function geocodeLocation(locationName: string): Promise<Result<GeocodingResult[]>> {
  try {
    if (!locationName.trim()) {
      return { 
        success: false, 
        error: { code: 'INVALID_INPUT', message: 'Location name is required' } 
      };
    }

    // Get current session for auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
      };
    }

    const response = await fetch(GEOCODE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ locationName: locationName.trim() }),
    });

    if (response.status === 429) {
      return { 
        success: false, 
        error: { code: 'RATE_LIMITED', message: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' } 
      };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: { 
          code: 'GEOCODING_ERROR', 
          message: errorData.error || 'Geocoding-Dienst nicht verfügbar' 
        } 
      };
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { 
        success: true, 
        data: [] 
      };
    }

    return { 
      success: true, 
      data: data.results as GeocodingResult[] 
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return { 
      success: false, 
      error: { 
        code: 'NETWORK_ERROR', 
        message: 'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.' 
      } 
    };
  }
}
