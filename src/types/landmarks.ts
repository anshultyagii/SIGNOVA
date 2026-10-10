export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type HandShape =
  | 'none'
  | 'open'
  | 'fist'
  | 'point'
  | 'victory'
  | 'thumbs_up'
  | 'pinch'
  | 'i_love_you'
  | 'call_me';

export interface ArmKinematics {
  elbowAngle: number; // 0 to 180 degrees
  shoulderAngle: number; // 0 to 180 degrees
  wristPosition: { x: number; y: number; z: number };
  isRaised: boolean;
  distanceToFace: number;
}

export interface HandKinematics {
  detected: boolean;
  shape: HandShape;
  pinchDistance: number;
  openFingersCount: number;
  palmFacing: 'camera' | 'away' | 'side' | 'unknown';
}

export interface FaceKinematics {
  mouthOpenRatio: number;
  browElevation: number;
  smileRatio: number;
  headTiltX: number; // pitch
  headTiltY: number; // yaw
  headTiltZ: number; // roll
}

export interface KinematicsSummary {
  leftArm: ArmKinematics;
  rightArm: ArmKinematics;
  leftHand: HandKinematics;
  rightHand: HandKinematics;
  face: FaceKinematics;
  handDistance: number;
}

export interface ProcessedFrame {
  id: number;
  timestamp: number;
  pose: LandmarkPoint[];
  face: LandmarkPoint[];
  leftHand: LandmarkPoint[] | null;
  rightHand: LandmarkPoint[] | null;
  worldPose: LandmarkPoint[] | null;
  kinematics: KinematicsSummary;
  /**
   * Normalized 1D feature vector ready for ML models (e.g., shape [1662] or [126]):
   * Standardized ordering: Pose (33*4=132), Face (468*3=1404), Left Hand (21*3=63), Right Hand (21*3=63)
   */
  featureVector: Float32Array;
}

export interface RecordedGestureSequence {
  id: string;
  label: string;
  recordedAt: string;
  fps: number;
  frameCount: number;
  frames: {
    timestamp: number;
    pose: LandmarkPoint[];
    faceKeypoints: LandmarkPoint[];
    leftHand: LandmarkPoint[] | null;
    rightHand: LandmarkPoint[] | null;
    kinematics: KinematicsSummary;
    featureVector: number[]; // serialized array for JSON export
  }[];
}
