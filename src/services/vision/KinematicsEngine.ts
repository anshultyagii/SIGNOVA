import type {
  LandmarkPoint,
  ArmKinematics,
  HandKinematics,
  FaceKinematics,
  KinematicsSummary,
  HandShape,
} from '../../types/landmarks';
import type { HolisticResults } from '../../types/mediapipe';

/**
 * Calculates Euclidean distance between two 3D points
 */
export function calculateDistance(a: LandmarkPoint, b: LandmarkPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates angle between three points in degrees (vertex at point B)
 */
export function calculateAngle(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

/**
 * Analyzes finger extension state on a 21-point hand
 */
function analyzeHandFingers(landmarks: LandmarkPoint[]) {
  const wrist = landmarks[0];
  const tips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
  const pip = [3, 6, 10, 14, 18];

  const extended: boolean[] = [];

  // Thumb extension (check distance between tip and pinky MCP)
  const thumbTipToPinky = calculateDistance(landmarks[4], landmarks[17]);
  const thumbMcpToPinky = calculateDistance(landmarks[2], landmarks[17]);
  extended.push(thumbTipToPinky > thumbMcpToPinky * 1.15);

  // Other 4 fingers: distance from tip to wrist compared to PIP to wrist
  for (let i = 1; i < 5; i++) {
    const tipDist = calculateDistance(landmarks[tips[i]], wrist);
    const pipDist = calculateDistance(landmarks[pip[i]], wrist);
    extended.push(tipDist > pipDist * 1.15);
  }

  const [thumb, index, middle, ring, pinky] = extended;
  const openCount = extended.filter(Boolean).length;
  const pinchDist = calculateDistance(landmarks[4], landmarks[8]);

  let shape: HandShape = 'none';

  if (pinchDist < 0.055) {
    shape = 'pinch';
  } else if (thumb && index && pinky && !middle && !ring) {
    shape = 'i_love_you';
  } else if (thumb && pinky && !index && !middle && !ring) {
    shape = 'call_me';
  } else if (thumb && !index && !middle && !ring && !pinky && landmarks[4].y < landmarks[2].y) {
    shape = 'thumbs_up';
  } else if (!thumb && index && middle && !ring && !pinky) {
    shape = 'victory';
  } else if (index && !middle && !ring && !pinky) {
    shape = 'point';
  } else if (openCount >= 4) {
    shape = 'open';
  } else if (openCount <= 1) {
    shape = 'fist';
  }

  return {
    shape,
    pinchDistance: pinchDist,
    openFingersCount: openCount,
    palmFacing: 'camera' as const,
  };
}

export class KinematicsEngine {
  /**
   * Computes comprehensive kinematics from holistic tracking results
   */
  public static compute(results: HolisticResults): KinematicsSummary {
    const pose = results.poseLandmarks;
    const face = results.faceLandmarks;
    const leftHand = results.leftHandLandmarks;
    const rightHand = results.rightHandLandmarks;

    // Default arm data
    const defaultArm: ArmKinematics = {
      elbowAngle: 0,
      shoulderAngle: 0,
      wristPosition: { x: 0, y: 0, z: 0 },
      isRaised: false,
      distanceToFace: 1.0,
    };

    let leftArm: ArmKinematics = { ...defaultArm };
    let rightArm: ArmKinematics = { ...defaultArm };
    let handDistance = 1.0;

    if (pose && pose.length >= 25) {
      // Pose Landmark Indices:
      // 11: left_shoulder, 12: right_shoulder
      // 13: left_elbow, 14: right_elbow
      // 15: left_wrist, 16: right_wrist
      // 23: left_hip, 24: right_hip
      // 0: nose
      const nose = pose[0];
      const leftShoulder = pose[11];
      const rightShoulder = pose[12];
      const leftElbow = pose[13];
      const rightElbow = pose[14];
      const leftWrist = pose[15];
      const rightWrist = pose[16];
      const leftHip = pose[23];
      const rightHip = pose[24];

      const leftElbowAng = calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAng = calculateAngle(rightShoulder, rightElbow, rightWrist);
      const leftShoulderAng = calculateAngle(leftHip, leftShoulder, leftElbow);
      const rightShoulderAng = calculateAngle(rightHip, rightShoulder, rightElbow);

      leftArm = {
        elbowAngle: leftElbowAng,
        shoulderAngle: leftShoulderAng,
        wristPosition: { x: leftWrist.x, y: leftWrist.y, z: leftWrist.z },
        isRaised: leftWrist.y < leftShoulder.y,
        distanceToFace: calculateDistance(leftWrist, nose),
      };

      rightArm = {
        elbowAngle: rightElbowAng,
        shoulderAngle: rightShoulderAng,
        wristPosition: { x: rightWrist.x, y: rightWrist.y, z: rightWrist.z },
        isRaised: rightWrist.y < rightShoulder.y,
        distanceToFace: calculateDistance(rightWrist, nose),
      };

      handDistance = calculateDistance(leftWrist, rightWrist);
    }

    // Hand Kinematics
    let leftHandKin: HandKinematics = {
      detected: false,
      shape: 'none',
      pinchDistance: 1.0,
      openFingersCount: 0,
      palmFacing: 'unknown',
    };

    if (leftHand && leftHand.length >= 21) {
      const analysis = analyzeHandFingers(leftHand);
      leftHandKin = {
        detected: true,
        ...analysis,
      };
    }

    let rightHandKin: HandKinematics = {
      detected: false,
      shape: 'none',
      pinchDistance: 1.0,
      openFingersCount: 0,
      palmFacing: 'unknown',
    };

    if (rightHand && rightHand.length >= 21) {
      const analysis = analyzeHandFingers(rightHand);
      rightHandKin = {
        detected: true,
        ...analysis,
      };
    }

    // Face Kinematics
    let faceKin: FaceKinematics = {
      mouthOpenRatio: 0,
      browElevation: 0,
      smileRatio: 0,
      headTiltX: 0,
      headTiltY: 0,
      headTiltZ: 0,
    };

    if (face && face.length >= 468) {
      // 13: upper lip, 14: lower lip
      // 61: mouth left corner, 291: mouth right corner
      // 10: top forehead, 152: chin
      // 70: left brow, 300: right brow
      const upperLip = face[13];
      const lowerLip = face[14];
      const mouthLeft = face[61];
      const mouthRight = face[291];
      const chin = face[152];
      const forehead = face[10];

      const mouthHeight = calculateDistance(upperLip, lowerLip);
      const mouthWidth = calculateDistance(mouthLeft, mouthRight);
      const faceHeight = calculateDistance(forehead, chin);

      const mouthOpenRatio = mouthWidth > 0 ? Number((mouthHeight / mouthWidth).toFixed(3)) : 0;
      const smileRatio = faceHeight > 0 ? Number((mouthWidth / faceHeight).toFixed(3)) : 0;

      faceKin = {
        mouthOpenRatio,
        browElevation: 0.5,
        smileRatio,
        headTiltX: Number((chin.z - forehead.z).toFixed(2)),
        headTiltY: Number((face[234].z - face[454].z).toFixed(2)), // temple depth diff
        headTiltZ: Number(((chin.x - forehead.x) * 100).toFixed(1)),
      };
    }

    return {
      leftArm,
      rightArm,
      leftHand: leftHandKin,
      rightHand: rightHandKin,
      face: faceKin,
      handDistance,
    };
  }
}
