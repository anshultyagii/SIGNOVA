import type { LandmarkPoint, ProcessedFrame } from '../../types/landmarks';
import type { HolisticResults } from '../../types/mediapipe';
import { KinematicsEngine } from '../vision/KinematicsEngine';

export class LandmarkNormalizer {
  private static frameCounter = 0;
  private static previousPose: LandmarkPoint[] | null = null;
  private static smoothingFactor = 0.35; // Exponential Moving Average smoothing (0 = none, 1 = max)

  public static setSmoothing(factor: number) {
    this.smoothingFactor = Math.max(0, Math.min(0.9, factor));
  }

  /**
   * Normalizes landmarks relative to shoulder center and shoulder width
   */
  public static processFrame(results: HolisticResults): ProcessedFrame {
    this.frameCounter++;
    const now = performance.now();

    const pose = results.poseLandmarks || [];
    const face = results.faceLandmarks || [];
    const leftHand = results.leftHandLandmarks || null;
    const rightHand = results.rightHandLandmarks || null;
    const worldPose = results.poseWorldLandmarks || null;

    // Determine reference anchor (Chest Center = midpoint of Left Shoulder 11 & Right Shoulder 12)
    let anchorX = 0.5;
    let anchorY = 0.5;
    let anchorZ = 0;
    let scale = 1.0;

    if (pose.length > 12) {
      const ls = pose[11]; // Left Shoulder
      const rs = pose[12]; // Right Shoulder
      anchorX = (ls.x + rs.x) / 2;
      anchorY = (ls.y + rs.y) / 2;
      anchorZ = ((ls.z || 0) + (rs.z || 0)) / 2;

      const shoulderDist = Math.hypot(ls.x - rs.x, ls.y - rs.y);
      if (shoulderDist > 0.05) {
        scale = shoulderDist;
      }
    }

    const normalizePoint = (pt: LandmarkPoint): LandmarkPoint => ({
      x: Number(((pt.x - anchorX) / scale).toFixed(4)),
      y: Number(((pt.y - anchorY) / scale).toFixed(4)),
      z: Number((((pt.z || 0) - anchorZ) / scale).toFixed(4)),
      visibility: pt.visibility,
    });

    // Normalized landmarks
    const normPose = pose.map(normalizePoint);
    const normFace = face.map(normalizePoint);
    const normLeftHand = leftHand ? leftHand.map(normalizePoint) : null;
    const normRightHand = rightHand ? rightHand.map(normalizePoint) : null;

    // Smoothing on pose
    if (this.previousPose && this.previousPose.length === normPose.length && this.smoothingFactor > 0) {
      for (let i = 0; i < normPose.length; i++) {
        normPose[i].x = normPose[i].x * (1 - this.smoothingFactor) + this.previousPose[i].x * this.smoothingFactor;
        normPose[i].y = normPose[i].y * (1 - this.smoothingFactor) + this.previousPose[i].y * this.smoothingFactor;
      }
    }
    this.previousPose = normPose;

    // Compute Kinematics
    const kinematics = KinematicsEngine.compute(results);

    // Build Flat ML Feature Vector
    // Layout: 33 Pose * 4 (132) + 468 Face * 3 (1404) + 21 LeftHand * 3 (63) + 21 RightHand * 3 (63) = 1662 features
    const featureVector = new Float32Array(1662);
    let offset = 0;

    // 1. Pose
    if (normPose.length >= 33) {
      for (let i = 0; i < 33; i++) {
        featureVector[offset++] = normPose[i].x;
        featureVector[offset++] = normPose[i].y;
        featureVector[offset++] = normPose[i].z;
        featureVector[offset++] = normPose[i].visibility ?? 1.0;
      }
    } else {
      offset += 132;
    }

    // 2. Face
    if (normFace.length >= 468) {
      for (let i = 0; i < 468; i++) {
        featureVector[offset++] = normFace[i].x;
        featureVector[offset++] = normFace[i].y;
        featureVector[offset++] = normFace[i].z;
      }
    } else {
      offset += 1404;
    }

    // 3. Left Hand
    if (normLeftHand && normLeftHand.length >= 21) {
      for (let i = 0; i < 21; i++) {
        featureVector[offset++] = normLeftHand[i].x;
        featureVector[offset++] = normLeftHand[i].y;
        featureVector[offset++] = normLeftHand[i].z;
      }
    } else {
      offset += 63;
    }

    // 4. Right Hand
    if (normRightHand && normRightHand.length >= 21) {
      for (let i = 0; i < 21; i++) {
        featureVector[offset++] = normRightHand[i].x;
        featureVector[offset++] = normRightHand[i].y;
        featureVector[offset++] = normRightHand[i].z;
      }
    } else {
      offset += 63;
    }

    return {
      id: this.frameCounter,
      timestamp: now,
      pose: normPose,
      face: normFace,
      leftHand: normLeftHand,
      rightHand: normRightHand,
      worldPose,
      kinematics,
      featureVector,
    };
  }
}
