import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, GitBranch, RefreshCw } from "lucide-react";
import {
  getSelectedVigilBranch,
  listVigilBranches,
  setSelectedVigilBranch,
  VIGIL_DEFAULT_BRANCH,
  type VigilBranchOption,
} from "@/lib/vigilBranchSource";
import "@/vigil-preview-branch-selector.css";

type BranchState =
  | { status: "loading"; branches: VigilBranchOption[] }
  | { status: "ready"; branches: VigilBranchOption[] }
  | { status: "error"; branches: VigilBranchOption[]; message: string };

export function VigilBranchSelector() {
  const [selected, setSelected] = useState(() => getSelectedVigilBranch());
  const [state, setState] = useState<BranchState>({ status: "loading", branches: [] });

  const refresh = useCallback(async () => {
    setState((current) => ({ status: "loading", branches: current.branches }));
    try {
      const branches = await listVigilBranches();
      setState({ status: "ready", branches });
    } catch (error) {
      setState({
        status: "error",
        branches: [],
        message: error instanceof Error ? error.message : "Unable to load VIGIL branches.",
      });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedBranch = useMemo(
    () => state.branches.find((item) => item.name === selected),
    [selected, state.branches],
  );

  function changeBranch(branch: string) {
    if (!branch || branch === selected) return;
    setSelected(branch);
    setSelectedVigilBranch(branch);
    window.location.reload();
  }

  return (
    <section className="vigil-preview-source" aria-label="VIGIL preview data source">
      <div className="vigil-preview-source-inner">
        <div className="vigil-preview-source-label">
          <Database aria-hidden="true" />
          <span>
            <strong>Preview data source</strong>
            <small>Live VIGIL branch</small>
          </span>
        </div>

        <label className="vigil-preview-source-select">
          <GitBranch aria-hidden="true" />
          <span className="sr-only">Select VIGIL branch</span>
          <select
            value={selected}
            onChange={(event) => changeBranch(event.target.value)}
            disabled={state.status === "loading" && !state.branches.length}
          >
            {!state.branches.some((item) => item.name === selected) && (
              <option value={selected}>{selected}</option>
            )}
            {state.branches.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}{item.name === VIGIL_DEFAULT_BRANCH ? " · canonical" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="vigil-preview-source-meta" aria-live="polite">
          {state.status === "loading" && <span>Refreshing branch list…</span>}
          {state.status === "ready" && selectedBranch && (
            <span><code>{selectedBranch.sha.slice(0, 8)}</code> · {state.branches.length} branches available</span>
          )}
          {state.status === "ready" && !selectedBranch && (
            <span className="is-warning">Selected branch is no longer present in VIGIL.</span>
          )}
          {state.status === "error" && <span className="is-warning">{state.message}</span>}
        </div>

        <button
          className="vigil-preview-source-refresh"
          type="button"
          onClick={() => void refresh()}
          aria-label="Refresh VIGIL branch list"
          title="Refresh VIGIL branch list"
        >
          <RefreshCw aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
