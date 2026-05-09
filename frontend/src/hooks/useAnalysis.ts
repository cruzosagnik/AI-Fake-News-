import { useState, useCallback } from 'react';
import { analyzeText, analyzeUrl, analyzePdf, analyzeImage } from '../lib/api';
import type { AnalysisResult } from '../types';

type InputType = 'text' | 'url' | 'pdf' | 'image' | 'social';

export interface AgentStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'failed';
}

const INITIAL_STEPS: AgentStep[] = [
  { id: 'A', label: 'Extracting Claims', status: 'pending' },
  { id: 'B', label: 'Detecting Category', status: 'pending' },
  { id: 'C', label: 'Verifying Sources', status: 'pending' },
  { id: 'D', label: 'Analyzing Bias', status: 'pending' },
  { id: 'E', label: 'Semantic Check', status: 'pending' },
  { id: 'F', label: 'Generating Verdict', status: 'pending' },
];

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);

  const runWithPipeline = useCallback(
    async (apiCall: () => Promise<AnalysisResult>) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'pending' })));

      // Animate agent steps sequentially
      const delays = [500, 1000, 1500, 2000, 2500, 3000];
      const timers: ReturnType<typeof setTimeout>[] = [];

      delays.forEach((delay, i) => {
        timers.push(
          setTimeout(() => {
            setSteps((prev) =>
              prev.map((s, idx) => {
                if (idx === i) return { ...s, status: 'running' };
                if (idx < i) return { ...s, status: 'done' };
                return s;
              })
            );
          }, delay)
        );
      });

      try {
        const data = await apiCall();
        timers.forEach(clearTimeout);
        setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'done' })));
        setResult(data);
      } catch (err: unknown) {
        timers.forEach(clearTimeout);
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        setSteps((prev) =>
          prev.map((s) => (s.status === 'running' ? { ...s, status: 'failed' } : s))
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const analyze = useCallback(
    async (type: InputType, payload: string | File, language = 'en') => {
      if (type === 'text' || type === 'social') {
        await runWithPipeline(() => analyzeText(payload as string, language));
      } else if (type === 'url') {
        await runWithPipeline(() => analyzeUrl(payload as string, language));
      } else if (type === 'pdf') {
        await runWithPipeline(() => analyzePdf(payload as File));
      } else if (type === 'image') {
        await runWithPipeline(() => analyzeImage(payload as File));
      }
    },
    [runWithPipeline]
  );

  return { result, loading, error, steps, analyze };
}
