import { useEffect, useState } from "react";
import { configApi } from "@/services/config.api";

interface PublicConfig {
  timezone: string;
}

let cachedConfig: PublicConfig | null = null;
let cachedError: Error | null = null;

export const usePublicConfig = () => {
  const [config, setConfig] = useState<PublicConfig | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig && !cachedError);
  const [error, setError] = useState<Error | null>(cachedError);

  useEffect(() => {
    if (cachedConfig || cachedError) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadConfig = async () => {
      try {
        const response = await configApi.getPublicConfig();
        if (response.data.success) {
          cachedConfig = response.data.data;
          if (isMounted) {
            setConfig(cachedConfig);
          }
        } else {
          throw new Error(response.data.message || "Failed to load configuration");
        }
      } catch (err) {
        cachedError = err as Error;
        if (isMounted) {
          setError(cachedError);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  return { config, loading, error };
};
