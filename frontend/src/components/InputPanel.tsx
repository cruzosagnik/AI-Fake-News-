import { AnimatedAIChat } from './ui/animated-ai-chat';

type TabId = 'text' | 'url' | 'pdf' | 'image' | 'social';

interface InputPanelProps {
  onAnalyze: (type: TabId, payload: string | File, language: string) => void;
  loading: boolean;
}

export default function InputPanel({ onAnalyze, loading }: InputPanelProps) {
  return <AnimatedAIChat onAnalyze={onAnalyze} loading={loading} />;
}
