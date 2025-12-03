import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Zap } from 'lucide-react';

interface OutputLine {
  text: string;
  complete: boolean;
}

interface SerialMonitorProps {
  output: OutputLine[];
  isConnected: boolean;
  isSimulationRunning: boolean;
  onSendMessage: (message: string) => void;
  onClear: () => void;
}

// Simple ANSI escape code processor
function processAnsiCodes(text: string): string {
  // Remove clear screen codes (both hex \x1b and unicode \u001b notation)
  let processed = text.replace(/\x1b\[2J/g, '').replace(/\u001b\[2J/g, '');
  // Remove cursor home codes
  processed = processed.replace(/\x1b\[H/g, '').replace(/\u001b\[H/g, '');
  // Remove other common ANSI codes (optional) - color codes etc
  processed = processed.replace(/\x1b\[[0-9;]*m/g, '').replace(/\u001b\[[0-9;]*m/g, '');
  return processed;
}

// Check if text contains special control characters
function hasControlChars(text: string): { hasClearScreen: boolean; hasCursorHome: boolean; hasCarriageReturn: boolean } {
  return {
    hasClearScreen: text.includes('\x1b[2J') || text.includes('\u001b[2J'),
    hasCursorHome: text.includes('\x1b[H') || text.includes('\u001b[H'),
    hasCarriageReturn: text.includes('\r')
  };
}

export function SerialMonitor({
  output,
  isConnected,
  isSimulationRunning = false,
  onSendMessage,
  onClear
}: SerialMonitorProps) {
  const [inputValue, setInputValue] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [terminalLines, setTerminalLines] = useState<Array<{text: string, incomplete: boolean}>>([]);

  // Process output with ANSI interpretation
  useEffect(() => {
    const lines: Array<{text: string, incomplete: boolean}> = [];
    let shouldClear = false;

    output.forEach((line) => {
      const text = line.text;
      const controls = hasControlChars(text);
      
      // Check for clear screen ANSI codes
      if (controls.hasClearScreen) {
        shouldClear = true;
        lines.length = 0; // Clear all lines
      }
      
      // Check for cursor home - also clear (common pattern)
      if (controls.hasCursorHome) {
        if (shouldClear) {
          lines.length = 0; // Clear confirmed
          shouldClear = false;
        }
      }

      // Check for carriage return - overwrites current line
      if (controls.hasCarriageReturn) {
        // Split by \r to handle multiple carriage returns
        const parts = text.split('\r');
        const cleanParts = parts.map(p => processAnsiCodes(p));
        
        // The last part after \r overwrites the current line
        if (cleanParts.length > 1) {
          const finalText = cleanParts[cleanParts.length - 1];
          if (lines.length > 0 && !lines[lines.length - 1].incomplete) {
            // If last line is complete, this starts a new line
            lines.push({
              text: finalText,
              incomplete: !line.complete
            });
          } else {
            // Overwrite the last line
            if (lines.length > 0) {
              lines[lines.length - 1] = {
                text: finalText,
                incomplete: !line.complete
              };
            } else {
              lines.push({
                text: finalText,
                incomplete: !line.complete
              });
            }
          }
          return;
        }
      }

      // Process the text (remove ANSI codes) and add to lines
      const cleanText = processAnsiCodes(text);
      
      if (cleanText) {
        // Simply map each output line to a terminal line
        lines.push({
          text: cleanText,
          incomplete: !line.complete
        });
      }
    });

    setTerminalLines(lines);
  }, [output]);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current && autoScroll && !userHasScrolled) {
      requestAnimationFrame(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      });
    }
  }, [terminalLines, autoScroll, userHasScrolled]);

  const handleScroll = () => {
    if (outputRef.current) {
      const element = outputRef.current;
      const isAtBottom = element.scrollHeight - element.clientHeight <= element.scrollTop + 5;
      setUserHasScrolled(!isAtBottom);
      setAutoScroll(isAtBottom);
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="serial-monitor">
      <div className="bg-muted px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${isSimulationRunning ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}
              data-testid="connection-indicator"
            />
            <i className="fas fa-comments text-accent text-sm"></i>
            <span className="text-sm font-medium">Serial Monitor</span>
            <span className="text-xs text-muted-foreground">115200 baud</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              data-testid="button-clear-serial"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-auto custom-scrollbar min-h-0"
        data-testid="serial-output"
        onScroll={handleScroll}
      >
        <div className="console-output p-3 text-xs font-mono">
          {terminalLines.length === 0 ? (
            <div className="text-muted-foreground italic">
              Serial output will appear here...
            </div>
          ) : (
            <div className="space-y-0">
              {terminalLines.map((line, index) => (
                <div 
                  key={`term-line-${index}`} 
                  className="text-foreground whitespace-pre-wrap break-words"
                >
                  {line.text}
                  {line.incomplete && (
                    <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-3 flex-shrink-0">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Send to Arduino..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-input border-border text-foreground placeholder-muted-foreground"
            data-testid="input-serial"
          />

          <Button
            onClick={handleSend}
            size="sm"
            disabled={!inputValue.trim() || !isSimulationRunning}
            className={`w-40 ${!inputValue.trim() || !isSimulationRunning ? '' : '!bg-green-600 hover:!bg-green-700 !text-white'}`}
            data-testid="button-send-serial"
          >
            <Zap className="h-3 w-3 mr-1" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}