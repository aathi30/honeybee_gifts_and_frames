import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../services/api";
export function useResource(url, params = {}) {
  const key = JSON.stringify(params);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: "" });
      return;
    }
    const controller = new AbortController();
    setState({ data: null, loading: true, error: "" });
    api
      .get(url, { params: JSON.parse(key), signal: controller.signal })
      .then((response) =>
        setState({ data: response.data, loading: false, error: "" }),
      )
      .catch((error) => {
        if (error.code !== "ERR_CANCELED")
          setState({ data: null, loading: false, error: errorText(error) });
      });
    return () => controller.abort();
  }, [url, key, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
