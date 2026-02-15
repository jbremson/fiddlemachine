declare module 'abcjs' {
  export interface RenderOptions {
    responsive?: 'resize';
    add_classes?: boolean;
    staffwidth?: number;
    scale?: number;
    paddingtop?: number;
    paddingbottom?: number;
    paddingleft?: number;
    paddingright?: number;
  }

  export interface NoteTimingEvent {
    milliseconds: number;
    left: number;
    top: number;
    height: number;
    width: number;
    elements: SVGElement[][];
    startChar: number;
    endChar: number;
    midiPitches?: { pitch: number; duration: number }[];
  }

  export interface TuneObject {
    lines: {
      staff?: {
        voices: unknown[][];
      }[];
    }[];
    getBeatLength(): number;
    getBarLength(): number;
    millisecondsPerMeasure(): number;
  }

  export function renderAbc(
    target: HTMLElement | string,
    abc: string,
    options?: RenderOptions
  ): TuneObject[];

  export type EventCallbackReturn = void | 'continue' | { type: string };
  export type EventCallback = (event: NoteTimingEvent | null) => EventCallbackReturn;

  export interface TimingCallbackOptions {
    qpm?: number;
    extraMeasuresAtBeginning?: number;
    lineEndAnticipation?: number;
    beatCallback?: (beatNumber: number, totalBeats: number, totalTime: number) => void;
    eventCallback?: EventCallback;
    lineEndCallback?: (info: unknown) => void;
  }

  export class TimingCallbacks {
    constructor(visualObj: TuneObject, options?: TimingCallbackOptions);
    start(position?: number, units?: string): void;
    pause(): void;
    stop(): void;
    reset(): void;
    setProgress(percent: number, units?: string): void;
  }
}
