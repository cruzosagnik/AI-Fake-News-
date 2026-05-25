"use client";

import * as React from 'react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  ArrowUpIcon,
  Command,
  FileText,
  FileUp,
  Globe,
  ImageIcon,
  LoaderIcon,
  MessageCircle,
  Paperclip,
  SendIcon,
  Sparkles,
  XIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type AnalysisType = 'text' | 'url' | 'pdf' | 'image' | 'social';

interface AnimatedAIChatProps {
  onAnalyze: (type: AnalysisType, payload: string | File, language: string) => void;
  loading: boolean;
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
  type: AnalysisType;
  placeholder: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <FileText className="h-4 w-4" />,
    label: 'Analyze Text',
    description: 'Paste an article, claim, or headline',
    prefix: '/text',
    type: 'text',
    placeholder: 'Paste news article, headline, or any text to fact-check...',
  },
  {
    icon: <Globe className="h-4 w-4" />,
    label: 'Check URL',
    description: 'Verify a story from a news link',
    prefix: '/url',
    type: 'url',
    placeholder: 'https://news-website.com/article...',
  },
  {
    icon: <FileUp className="h-4 w-4" />,
    label: 'Read PDF',
    description: 'Upload a PDF document',
    prefix: '/pdf',
    type: 'pdf',
    placeholder: 'Attach a PDF, then send it for analysis...',
  },
  {
    icon: <ImageIcon className="h-4 w-4" />,
    label: 'Inspect Image',
    description: 'Upload an image or screenshot',
    prefix: '/image',
    type: 'image',
    placeholder: 'Attach an image, then send it for analysis...',
  },
  {
    icon: <MessageCircle className="h-4 w-4" />,
    label: 'Social Post',
    description: 'Check a post, tweet, or forward',
    prefix: '/social',
    type: 'social',
    placeholder: 'Paste a social media post, tweet, or WhatsApp forward...',
  },
];

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
];

function getMatchingCommandIndex(nextValue: string) {
  if (!nextValue.startsWith('/') || nextValue.includes(' ')) return -1;
  return commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(nextValue));
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY),
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className={cn('relative', containerClassName)}>
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/35 px-3 py-2 text-sm',
            'transition-all duration-200 ease-in-out placeholder:text-zinc-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
            showRing ? 'focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0' : '',
            className,
          )}
          ref={ref}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
          {...props}
        />

        <AnimatePresence>
          {showRing && isFocused && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-orange-400/25 ring-offset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export function AnimatedAIChat({ onAnalyze, loading }: AnimatedAIChatProps) {
  const [value, setValue] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('text');
  const [language, setLanguage] = useState('en');
  const [isPending, startTransition] = useTransition();
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [inputFocused, setInputFocused] = useState(false);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 76,
    maxHeight: 210,
  });

  const currentCommand = commandSuggestions.find((command) => command.type === analysisType) ?? commandSuggestions[0];
  const isFileMode = analysisType === 'pdf' || analysisType === 'image';
  const disabled = loading || isPending || !isReady(analysisType, value, attachment);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector('[data-command-button]');

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setAnalysisType(selectedCommand.type);
    setValue('');
    setAttachment(null);
    setShowCommandPalette(false);
    setRecentCommand(selectedCommand.label);
    setTimeout(() => setRecentCommand(null), 2200);
    requestAnimationFrame(() => adjustHeight(true));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion((prev) => (prev < commandSuggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : commandSuggestions.length - 1));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          selectCommandSuggestion(activeSuggestion);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (disabled) return;

    startTransition(() => {
      if (isFileMode && attachment) {
        onAnalyze(analysisType, attachment, language);
      } else {
        onAnalyze(analysisType, value, language);
      }
    });
  };

  const handleAttachFile = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      if (file.type.startsWith('image/')) {
        setAnalysisType('image');
      } else {
        setAnalysisType('pdf');
      }
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-center overflow-visible text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[2rem]">
        <div className="absolute -top-28 left-1/4 h-72 w-72 rounded-full bg-orange-500/10 blur-[96px]" />
        <div className="absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-zinc-200/5 blur-[96px]" />
      </div>

      <motion.div
        className="relative z-10 w-full space-y-5"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur-xl">
            <Sparkles className="h-3.5 w-3.5 text-orange-300" />
            VerifyX workspace
          </div>
          <h2 className="mt-4 font-serif text-3xl text-white sm:text-4xl">What should we verify?</h2>
          <p className="mt-2 text-sm text-zinc-500">Use commands, paste content, or attach evidence.</p>
        </div>

        <motion.div
          className="relative rounded-[1.75rem] border border-white/10 bg-black/45 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AnimatePresence>
            {showCommandPalette && (
              <motion.div
                ref={commandPaletteRef}
                className="absolute bottom-full left-4 right-4 z-50 mb-2 overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                <div className="py-1">
                  {commandSuggestions.map((suggestion, index) => (
                    <motion.button
                      type="button"
                      key={suggestion.prefix}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition-colors',
                        activeSuggestion === index ? 'bg-orange-500/12 text-white' : 'text-zinc-400 hover:bg-white/5',
                      )}
                      onClick={() => selectCommandSuggestion(index)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-orange-200">
                        {suggestion.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="truncate text-zinc-600">{suggestion.description}</div>
                      </div>
                      <div className="text-zinc-600">{suggestion.prefix}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-black shadow-lg shadow-orange-500/20">
              {currentCommand.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">{currentCommand.label}</p>
              <p className="truncate text-xs text-zinc-600">{currentCommand.description}</p>
            </div>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-orange-300/40"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code} className="bg-zinc-950">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                const nextValue = e.target.value;
                const matchingSuggestionIndex = getMatchingCommandIndex(nextValue);
                setValue(nextValue);
                setShowCommandPalette(nextValue.startsWith('/') && !nextValue.includes(' '));
                setActiveSuggestion(matchingSuggestionIndex);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={isFileMode ? currentCommand.placeholder : `${currentCommand.placeholder} Type / for commands.`}
              containerClassName="w-full"
              className="min-h-[76px] w-full resize-none border-none bg-transparent px-3 py-2 text-sm text-white/90 outline-none placeholder:text-zinc-700 focus:outline-none"
              style={{ overflow: 'hidden' }}
              showRing={false}
            />
          </div>

          <AnimatePresence>
            {attachment && (
              <motion.div
                className="flex flex-wrap gap-2 px-4 pb-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
                  <Paperclip className="h-3.5 w-3.5 text-orange-300" />
                  <span className="max-w-[14rem] truncate">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="text-zinc-600 transition-colors hover:text-white"
                    aria-label="Remove attachment"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] p-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept={analysisType === 'image' ? 'image/*' : '.pdf,image/*'}
                className="hidden"
                onChange={handleFileChange}
              />
              <motion.button
                type="button"
                onClick={handleAttachFile}
                whileTap={{ scale: 0.94 }}
                className="group relative rounded-full p-2 text-zinc-500 transition-colors hover:text-orange-200"
                aria-label="Attach file"
              >
                <Paperclip className="relative z-10 h-4 w-4" />
                <span className="absolute inset-0 rounded-full bg-white/[0.05] opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
              <motion.button
                type="button"
                data-command-button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommandPalette((prev) => !prev);
                  if (!value) {
                    setValue('/');
                    setActiveSuggestion(0);
                  }
                  requestAnimationFrame(() => adjustHeight());
                }}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  'group relative rounded-full p-2 text-zinc-500 transition-colors hover:text-orange-200',
                  showCommandPalette && 'bg-white/10 text-orange-200',
                )}
                aria-label="Open command palette"
              >
                <Command className="relative z-10 h-4 w-4" />
                <span className="absolute inset-0 rounded-full bg-white/[0.05] opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.button>
              <AnimatePresence>
                {recentCommand && (
                  <motion.span
                    className="hidden text-xs text-orange-200/70 sm:inline"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                  >
                    {recentCommand} selected
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              onClick={handleSendMessage}
              whileHover={{ scale: disabled ? 1 : 1.01 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all',
                disabled
                  ? 'bg-white/[0.05] text-zinc-600'
                  : 'bg-orange-500 text-black shadow-lg shadow-orange-500/25 hover:bg-orange-400',
              )}
            >
              {loading || isPending ? (
                <LoaderIcon className="h-4 w-4 animate-[spin_2s_linear_infinite]" />
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
              <span>{loading || isPending ? 'Analyzing' : 'Send'}</span>
              {!loading && !isPending && <ArrowUpIcon className="h-3.5 w-3.5" />}
            </motion.button>
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {commandSuggestions.map((suggestion, index) => (
            <motion.button
              key={suggestion.prefix}
              type="button"
              onClick={() => selectCommandSuggestion(index)}
              className={cn(
                'relative flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all',
                analysisType === suggestion.type
                  ? 'border-orange-300/30 bg-orange-500/10 text-orange-100'
                  : 'border-white/[0.06] bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-white',
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {suggestion.icon}
              <span>{suggestion.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed bottom-8 z-50 rounded-full border border-white/[0.08] bg-black/70 px-4 py-2 shadow-lg shadow-black/50 backdrop-blur-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-8 items-center justify-center rounded-full bg-orange-500 text-center text-black">
                <span className="text-xs font-bold">AI</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <span>Verifying</span>
                <TypingDots />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {inputFocused && (
        <motion.div
          className="pointer-events-none fixed z-0 h-[42rem] w-[42rem] rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-zinc-100 opacity-[0.025] blur-[96px]"
          animate={{
            x: mousePosition.x - 336,
            y: mousePosition.y - 336,
          }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="ml-1 flex items-center">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="mx-0.5 h-1.5 w-1.5 rounded-full bg-orange-200"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 0 4px rgba(251, 146, 60, 0.45)',
          }}
        />
      ))}
    </div>
  );
}

function isReady(type: AnalysisType, value: string, attachment: File | null) {
  if (type === 'text') return value.trim().length > 20;
  if (type === 'url') return value.trim().startsWith('http');
  if (type === 'social') return value.trim().length > 10;
  return attachment !== null;
}