export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type NormalizedLandmarkList = NormalizedLandmark[];

export interface HolisticResults {
  poseLandmarks?: NormalizedLandmarkList;
  poseWorldLandmarks?: NormalizedLandmarkList;
  faceLandmarks?: NormalizedLandmarkList;
  leftHandLandmarks?: NormalizedLandmarkList;
  rightHandLandmarks?: NormalizedLandmarkList;
  image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
}

export interface HolisticOptions {
  modelComplexity?: 0 | 1 | 2;
  smoothLandmarks?: boolean;
  enableSegmentation?: boolean;
  smoothSegmentation?: boolean;
  refineFaceLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export interface HolisticConstructorOptions {
  locateFile?: (file: string) => string;
}

export declare class Holistic {
  constructor(options?: HolisticConstructorOptions);
  setOptions(options: HolisticOptions): void;
  onResults(callback: (results: HolisticResults) => void): void;
  send(input: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
  close(): Promise<void>;
}

export interface CameraOptions {
  onFrame: () => Promise<void>;
  width?: number;
  height?: number;
}

export declare class Camera {
  constructor(videoElement: HTMLVideoElement, options: CameraOptions);
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type ConnectionPair = [number, number];

declare global {
  interface Window {
    Holistic?: typeof Holistic;
    Camera?: typeof Camera;
    drawConnectors?: (
      ctx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmarkList,
      connections: ConnectionPair[],
      style?: { color?: string; lineWidth?: number }
    ) => void;
    drawLandmarks?: (
      ctx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmarkList,
      style?: { color?: string; fillColor?: string; lineWidth?: number; radius?: number }
    ) => void;
    FACEMESH_TESSELATION?: ConnectionPair[];
    FACEMESH_CONTOURS?: ConnectionPair[];
    HAND_CONNECTIONS?: ConnectionPair[];
    POSE_CONNECTIONS?: ConnectionPair[];
  }
}
