import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { VigilObservatoryNav } from "@/components/vigil/VigilObservatoryNav";
import { loadVigilRecordDetail, loadVigilRegistryRecords, type UnknownRecord } from "@/lib/vigilRegistry";
import { normalizeRecords, normalizeVigilRecord, type VigilIndexRecord } from "@/lib/vigilPresentation";
import type { CorpusProvision, RecordChain } from "@/lib/vigilPublicDisplay";

// NOTE: This file is intentionally not rewritten here. The public runtime enhancement
// layer normalises report navigation to Case Files so the report returns to the
// investigation surface rather than the raw Observatory ledger.

export { };
