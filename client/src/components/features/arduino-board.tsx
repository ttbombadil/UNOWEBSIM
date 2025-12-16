import { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';

interface PinState {
  pin: number;
  mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
  value: number; // 0-255 for analog, 0 or 1 for digital
  type: 'digital' | 'analog' | 'pwm';
}

interface ArduinoBoardProps {
  pinStates?: PinState[];
  isSimulationRunning?: boolean;
}

// Digital pin positions in the SVG (x coordinates, y=19 for all)
// Pin 13 is at x=134.8, then each pin is +9 units apart
const DIGITAL_PIN_POSITIONS: { [key: number]: { x: number; y: number } } = {
  13: { x: 134.8, y: 19 },
  12: { x: 143.8, y: 19 },
  11: { x: 152.8, y: 19 },
  10: { x: 161.8, y: 19 },
  9: { x: 170.8, y: 19 },
  8: { x: 179.8, y: 19 },
  7: { x: 194.2, y: 19 },
  6: { x: 203.2, y: 19 },
  5: { x: 212.2, y: 19 },
  4: { x: 221.2, y: 19 },
  3: { x: 230.2, y: 19 },
  2: { x: 239.2, y: 19 },
  1: { x: 248.2, y: 19 },
  0: { x: 257.2, y: 19 },
};

export function ArduinoBoard({
  pinStates = [],
  isSimulationRunning = false,
}: ArduinoBoardProps) {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    // Load SVG content
    fetch('/ArduinoUno.svg')
      .then(response => response.text())
      .then(text => {
        setSvgContent(text);
      })
      .catch(err => console.error('Failed to load Arduino SVG:', err));
  }, []);

  // Get the color for a digital pin based on its state
  const getPinColor = (pin: number): string => {
    const state = pinStates.find(p => p.pin === pin);
    if (!state) return 'transparent'; // No state = no overlay
    
    if (state.mode === 'OUTPUT') {
      if (state.value > 0) {
        // HIGH = bright green glow
        return '#00ff00';
      } else {
        // LOW = red
        return '#ff0000';
      }
    } else if (state.mode === 'INPUT' || state.mode === 'INPUT_PULLUP') {
      // Input mode = yellow
      return '#ffff00';
    }
    return 'transparent';
  };

  // Generate SVG circles for pin state overlays
  const generatePinOverlays = (): string => {
    let overlays = '';
    
    for (const [pinStr, pos] of Object.entries(DIGITAL_PIN_POSITIONS)) {
      const pin = parseInt(pinStr);
      const color = getPinColor(pin);
      
      if (color !== 'transparent') {
        // Add a glowing circle overlay on the pin
        overlays += `
          <circle cx="${pos.x}" cy="${pos.y}" r="2.5" 
            fill="${color}" 
            fill-opacity="0.8"
            style="filter: drop-shadow(0 0 2px ${color});"
          />
        `;
      }
    }
    
    return overlays;
  };

  // Modify SVG to show LED status and pin states
  const getModifiedSvg = () => {
    if (!svgContent) return '';
    
    let modified = svgContent;
    
    // Remove XML declaration if present
    modified = modified.replace(/<\?xml[^?]*\?>/g, '');
    
    // Add width/height to SVG if not present and ensure it scales properly
    modified = modified.replace(
      /<svg([^>]*)>/,
      '<svg$1 style="width: 100%; height: 100%; max-width: 600px;">'
    );
    
    if (isSimulationRunning) {
      // LED ON: bright green with glow effect
      modified = modified.replace(
        /<rect id="rect23418" class="st33"/g,
        '<rect id="rect23418" style="fill: #00ff00; filter: drop-shadow(0 0 3px #00ff00);"'
      );
    } else {
      // LED OFF: dark green
      modified = modified.replace(
        /<rect id="rect23418" class="st33"/g,
        '<rect id="rect23418" style="fill: #1a3d1a; fill-opacity: 0.6;"'
      );
    }
    
    // Add pin state overlays before closing </svg> tag
    const pinOverlays = generatePinOverlays();
    if (pinOverlays) {
      modified = modified.replace('</svg>', `${pinOverlays}</svg>`);
    }
    
    return modified;
  };

  return (
    <div className="h-full flex flex-col bg-card border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted px-3 py-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">Arduino UNO Board</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isSimulationRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isSimulationRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Board Visualization */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-900 min-h-0">
        {svgContent ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))' }}
            dangerouslySetInnerHTML={{ __html: getModifiedSvg() }}
          />
        ) : (
          <div className="text-gray-500">Loading Arduino Board...</div>
        )}
      </div>
    </div>
  );
}
