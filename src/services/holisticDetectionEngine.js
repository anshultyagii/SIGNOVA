/**
 * SignNova Multimodal Holistic Detection Engine
 * Integrates Hand Landmarks (Left & Right), Pose (Upper Body), and Face Mesh
 * with spatial normalization, kinematic trajectory buffers, and multi-factor classification.
 */

// Helper 3D Euclidean distance
function dist3D(a, b) {
  if (!a || !b) return 999;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 2D Euclidean distance
function dist2D(a, b) {
  if (!a || !b) return 999;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export class HolisticDetectionEngine {
  constructor(options = {}) {
    this.confidenceThreshold = options.confidenceThreshold || 0.65;
    this.smoothingFactor = options.smoothingFactor || 0.35;
    
    // Rolling trajectory buffer (last 30 frames)
    this.frameBuffer = [];
    this.maxBufferSize = 30;
    
    // Prediction stability tracker
    this.lastCandidates = [];
    this.stablePrediction = null;
    this.stableCount = 0;
    this.minStableFrames = 4;
    
    // Previous smoothed probabilities
    this.smoothedScores = {};
  }

  setConfidenceThreshold(val) {
    this.confidenceThreshold = Math.max(0.1, Math.min(0.99, val));
  }

  /**
   * Primary frame processing entry point.
   * @param {Object} results MediaPipe holistic results
   * @returns {Object} classification result with probabilities and debug telemetry
   */
  processFrame(results) {
    const timestamp = Date.now();
    const face = results.faceLandmarks;
    const pose = results.poseLandmarks;
    const leftHand = results.leftHandLandmarks;
    const rightHand = results.rightHandLandmarks;

    const hasFace = !!(face && face.length > 0);
    const hasPose = !!(pose && pose.length > 0);
    const hasLeftHand = !!(leftHand && leftHand.length > 0);
    const hasRightHand = !!(rightHand && rightHand.length > 0);
    const hasAnyHand = hasLeftHand || hasRightHand;

    // Detect if user is completely idle / hands not in gesture area
    if (!hasAnyHand && !hasPose) {
      return {
        prediction: null,
        confidence: 0,
        candidates: [],
        status: "idle",
        statusText: "Waiting for user in frame...",
        telemetry: { hasFace, hasPose, hasLeftHand, hasRightHand, fps: 0 }
      };
    }

    // 1. Compute Body Normalization Scale from Pose
    // Distance between left shoulder (11) and right shoulder (12)
    let torsoScale = 0.35; // default fallback
    let chestCenter = { x: 0.5, y: 0.65, z: 0 };
    let headCenter = { x: 0.5, y: 0.25, z: 0 };
    let chin = { x: 0.5, y: 0.35, z: 0 };
    let mouth = { x: 0.5, y: 0.32, z: 0 };
    let forehead = { x: 0.5, y: 0.18, z: 0 };

    if (hasPose) {
      const leftShoulder = pose[11];
      const rightShoulder = pose[12];
      if (leftShoulder && rightShoulder) {
        torsoScale = Math.max(0.1, dist2D(leftShoulder, rightShoulder));
        chestCenter = {
          x: (leftShoulder.x + rightShoulder.x) / 2,
          y: (leftShoulder.y + rightShoulder.y) / 2 + 0.05,
          z: ((leftShoulder.z || 0) + (rightShoulder.z || 0)) / 2
        };
      }
      if (pose[0]) headCenter = pose[0]; // nose
    }

    if (hasFace) {
      if (face[1]) headCenter = face[1]; // nose tip
      if (face[152]) chin = face[152]; // chin bottom
      if (face[13]) mouth = face[13]; // upper/inner lip
      if (face[10]) forehead = face[10]; // top of forehead
    }

    // 2. Analyze Hand Geometries
    const rightAnalysis = hasRightHand ? this.analyzeHand(rightHand, torsoScale) : null;
    const leftAnalysis = hasLeftHand ? this.analyzeHand(leftHand, torsoScale) : null;

    // Determine dominant hand (prefer right hand, fallback to left)
    const domHand = rightAnalysis || leftAnalysis;
    const nonDomHand = rightAnalysis && leftAnalysis ? leftAnalysis : null;
    const isTwoHanded = !!(hasRightHand && hasLeftHand);

    // If hands are resting down at bottom of frame, treat as idle
    if (domHand && domHand.wrist.y > chestCenter.y + 0.35) {
      return {
        prediction: null,
        confidence: 0,
        candidates: [],
        status: "resting",
        statusText: "Hands at rest. Raise hands to sign.",
        telemetry: { hasFace, hasPose, hasLeftHand, hasRightHand }
      };
    }

    // Record frame into trajectory buffer
    const frameData = {
      timestamp,
      domHandPos: domHand ? { ...domHand.wrist } : null,
      domHandFingers: domHand ? domHand.fingers : null,
      twoHandDist: isTwoHanded ? dist2D(rightAnalysis.wrist, leftAnalysis.wrist) / torsoScale : null,
      headPos: { ...headCenter }
    };
    this.frameBuffer.push(frameData);
    if (this.frameBuffer.length > this.maxBufferSize) {
      this.frameBuffer.shift();
    }

    // Compute velocity & movement trajectory
    const movement = this.computeKinematics(torsoScale);

    // 3. Score all vocabulary signs using multimodal feature matching
    const rawScores = {};

    // Evaluate Number signs (0-10)
    this.scoreNumbers(rawScores, domHand, movement, torsoScale);

    // Evaluate Word signs
    this.scoreWords(rawScores, {
      domHand,
      nonDomHand,
      isTwoHanded,
      movement,
      chestCenter,
      chin,
      mouth,
      forehead,
      headCenter,
      torsoScale,
      hasFace,
      face
    });

    // 4. Smooth scores across frames using Exponential Moving Average
    const smoothed = {};
    for (const [token, score] of Object.entries(rawScores)) {
      const prev = this.smoothedScores[token] || 0;
      smoothed[token] = prev * (1 - this.smoothingFactor) + score * this.smoothingFactor;
    }
    this.smoothedScores = smoothed;

    // Rank candidates
    const sorted = Object.entries(smoothed)
      .filter(([_, score]) => score > 0.3)
      .sort((a, b) => b[1] - a[1])
      .map(([token, score]) => ({
        token,
        score: Math.min(0.99, Math.round(score * 100) / 100)
      }));

    const topCandidate = sorted[0];
    let confirmedToken = null;
    let confidence = 0;

    if (topCandidate && topCandidate.score >= this.confidenceThreshold) {
      if (topCandidate.token === this.stablePrediction) {
        this.stableCount++;
      } else {
        this.stablePrediction = topCandidate.token;
        this.stableCount = 1;
      }

      if (this.stableCount >= this.minStableFrames) {
        confirmedToken = topCandidate.token;
        confidence = topCandidate.score;
      }
    } else {
      this.stableCount = Math.max(0, this.stableCount - 1);
      if (this.stableCount === 0) {
        this.stablePrediction = null;
      }
    }

    return {
      prediction: confirmedToken,
      confidence: confidence,
      candidate: topCandidate ? topCandidate.token : null,
      candidateConfidence: topCandidate ? topCandidate.score : 0,
      candidates: sorted.slice(0, 4),
      status: confirmedToken ? "detected" : (topCandidate ? "tracking" : "searching"),
      statusText: confirmedToken 
        ? `Recognized: ${confirmedToken}`
        : (topCandidate ? `Holding: ${topCandidate.token} (${Math.round(topCandidate.score * 100)}%)` : "Position hand clearly in frame"),
      telemetry: {
        hasFace,
        hasPose,
        hasLeftHand,
        hasRightHand,
        isTwoHanded,
        dominantHand: rightAnalysis ? "Right" : (leftAnalysis ? "Left" : "None"),
        movementDynamics: movement.motionType,
        velocity: movement.speed
      }
    };
  }

  /**
   * Detailed kinematic and geometric analysis for a 21-landmark hand
   */
  analyzeHand(landmarks, torsoScale) {
    const wrist = landmarks[0];
    const palmBase = landmarks[0];
    const indexMCP = landmarks[5];
    const middleMCP = landmarks[9];
    const ringMCP = landmarks[13];
    const pinkyMCP = landmarks[17];

    // Palm size reference
    const palmLength = Math.max(0.04, dist2D(wrist, middleMCP));

    // Finger Tip & Knuckle references
    // 0: Wrist
    // 1-4: Thumb (1=CMC, 2=MCP, 3=IP, 4=Tip)
    // 5-8: Index (5=MCP, 6=PIP, 7=DIP, 8=Tip)
    // 9-12: Middle (9=MCP, 10=PIP, 11=DIP, 12=Tip)
    // 13-16: Ring (13=MCP, 14=PIP, 15=DIP, 16=Tip)
    // 17-20: Pinky (17=MCP, 18=PIP, 19=DIP, 20=Tip)
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Measure finger extension: Tip distance from wrist relative to MCP distance
    const isFingerExtended = (tip, pip, mcp) => {
      const tipDist = dist2D(tip, wrist);
      const mcpDist = dist2D(mcp, wrist);
      const pipDist = dist2D(pip, wrist);
      return tipDist > pipDist * 1.08 && tipDist > mcpDist * 1.35;
    };

    // Thumb extension (often lateral)
    const thumbDist = dist2D(thumbTip, wrist);
    const thumbMCPDist = dist2D(landmarks[2], wrist);
    const isThumbExtended = thumbDist > thumbMCPDist * 1.25 && dist2D(thumbTip, indexMCP) > palmLength * 0.55;

    const fingers = {
      thumb: isThumbExtended,
      index: isFingerExtended(indexTip, landmarks[6], indexMCP),
      middle: isFingerExtended(middleTip, landmarks[10], middleMCP),
      ring: isFingerExtended(ringTip, landmarks[14], ringMCP),
      pinky: isFingerExtended(pinkyTip, landmarks[18], pinkyMCP)
    };

    // Extension scores (0 to 1 continuous)
    const fingerScores = {
      thumb: Math.min(1, Math.max(0, (dist2D(thumbTip, indexMCP) - palmLength * 0.3) / (palmLength * 0.8))),
      index: Math.min(1, Math.max(0, (dist2D(indexTip, wrist) - palmLength * 1.1) / (palmLength * 1.1))),
      middle: Math.min(1, Math.max(0, (dist2D(middleTip, wrist) - palmLength * 1.1) / (palmLength * 1.1))),
      ring: Math.min(1, Math.max(0, (dist2D(ringTip, wrist) - palmLength * 1.1) / (palmLength * 1.1))),
      pinky: Math.min(1, Math.max(0, (dist2D(pinkyTip, wrist) - palmLength * 0.9) / (palmLength * 0.9)))
    };

    // Pinches (tip-to-thumb distance relative to palm length)
    const pinches = {
      indexThumb: dist2D(indexTip, thumbTip) / palmLength,
      middleThumb: dist2D(middleTip, thumbTip) / palmLength,
      ringThumb: dist2D(ringTip, thumbTip) / palmLength,
      pinkyThumb: dist2D(pinkyTip, thumbTip) / palmLength
    };

    // All fingers curled in a fist?
    const isFist = !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky;

    // Open hand?
    const isOpenHand = fingers.index && fingers.middle && fingers.ring && fingers.pinky;

    // Finger count
    const extendedCount = (fingers.index ? 1 : 0) + (fingers.middle ? 1 : 0) + 
                          (fingers.ring ? 1 : 0) + (fingers.pinky ? 1 : 0) + 
                          (fingers.thumb ? 1 : 0);

    return {
      wrist,
      indexTip,
      middleTip,
      ringTip,
      pinkyTip,
      thumbTip,
      palmLength,
      fingers,
      fingerScores,
      pinches,
      isFist,
      isOpenHand,
      extendedCount
    };
  }

  /**
   * Trajectory and velocity kinematics across the recent rolling frames
   */
  computeKinematics(torsoScale) {
    if (this.frameBuffer.length < 4) {
      return { speed: 0, deltaX: 0, deltaY: 0, motionType: "stationary" };
    }

    const recent = this.frameBuffer.slice(-8);
    const start = recent[0].domHandPos;
    const end = recent[recent.length - 1].domHandPos;

    if (!start || !end) {
      return { speed: 0, deltaX: 0, deltaY: 0, motionType: "stationary" };
    }

    const deltaX = (end.x - start.x) / torsoScale;
    const deltaY = (end.y - start.y) / torsoScale;
    const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let motionType = "stationary";
    if (speed > 0.25) {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        motionType = deltaX > 0 ? "swipe-right" : "swipe-left";
      } else if (Math.abs(deltaY) > Math.abs(deltaX) * 1.4) {
        motionType = deltaY > 0 ? "downward" : "upward";
      } else {
        motionType = "diagonal";
      }
    }

    return { speed, deltaX, deltaY, motionType };
  }

  /**
   * Score ASL numbers 0 through 10
   */
  scoreNumbers(scores, hand, movement, torsoScale) {
    if (!hand) return;
    const { fingers, fingerScores, pinches, isFist, isOpenHand, extendedCount } = hand;

    // Number 0: 'O' handshape (all fingertips close to thumb tip)
    const avgPinch = (pinches.indexThumb + pinches.middleThumb + pinches.ringThumb + pinches.pinkyThumb) / 4;
    if (avgPinch < 0.65 && !isOpenHand && !isFist) {
      scores["0"] = 0.88 - avgPinch * 0.4;
    }

    // Number 1: Only Index extended upright
    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      const bonus = !fingers.thumb ? 0.94 : 0.78;
      scores["1"] = bonus * fingerScores.index;
    }

    // Number 2: Index + Middle extended (V-shape), Ring & Pinky curled
    if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky && !fingers.thumb) {
      scores["2"] = 0.92 * ((fingerScores.index + fingerScores.middle) / 2);
    }

    // Number 3 (ASL): Thumb + Index + Middle extended; Ring & Pinky curled
    if (fingers.thumb && fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
      scores["3"] = 0.93 * ((fingerScores.index + fingerScores.middle + fingerScores.thumb) / 3);
    }

    // Number 4: Index + Middle + Ring + Pinky extended; Thumb tucked
    if (fingers.index && fingers.middle && fingers.ring && fingers.pinky && !fingers.thumb) {
      scores["4"] = 0.92 * ((fingerScores.index + fingerScores.middle + fingerScores.ring + fingerScores.pinky) / 4);
    }

    // Number 5: All 5 fingers extended spread
    if (isOpenHand && fingers.thumb) {
      scores["5"] = 0.94 * ((fingerScores.index + fingerScores.middle + fingerScores.ring + fingerScores.pinky + fingerScores.thumb) / 5);
    }

    // Number 6 (ASL): Thumb touches pinky; index, middle, ring extended
    if (pinches.pinkyThumb < 0.55 && fingers.index && fingers.middle && fingers.ring) {
      scores["6"] = 0.89;
    }

    // Number 7 (ASL): Thumb touches ring; index, middle, pinky extended
    if (pinches.ringThumb < 0.55 && fingers.index && fingers.middle && fingers.pinky) {
      scores["7"] = 0.89;
    }

    // Number 8 (ASL): Thumb touches middle; index, ring, pinky extended
    if (pinches.middleThumb < 0.55 && fingers.index && fingers.ring && fingers.pinky) {
      scores["8"] = 0.89;
    }

    // Number 9 (ASL): Thumb touches index; middle, ring, pinky extended
    if (pinches.indexThumb < 0.52 && fingers.middle && fingers.ring && fingers.pinky) {
      scores["9"] = 0.90;
    }

    // Number 10 (ASL): Thumbs-up fist (A-shape) held or shaking
    if (isFist && fingers.thumb) {
      scores["10"] = 0.85;
    }
  }

  /**
   * Score ASL words with multimodal hand-pose-face synergy
   */
  scoreWords(scores, ctx) {
    const { domHand, nonDomHand, isTwoHanded, movement, chestCenter, chin, mouth, forehead, torsoScale, hasFace, face } = ctx;
    if (!domHand) return;

    const { fingers, fingerScores, pinches, isFist, isOpenHand, wrist, indexTip } = domHand;

    // Distances relative to body landmarks (normalized by torso scale)
    const distToChin = dist2D(wrist, chin) / torsoScale;
    const distToMouth = dist2D(wrist, mouth) / torsoScale;
    const distToForehead = dist2D(wrist, forehead) / torsoScale;
    const distToChest = dist2D(wrist, chestCenter) / torsoScale;

    // ================= 1. HELLO =================
    // Flat hand near forehead/temple, moving outward or held upright near head
    if (isOpenHand && distToForehead < 0.95 && wrist.y < chin.y) {
      let score = 0.80;
      if (movement.speed > 0.15 && (movement.deltaX > 0.05 || movement.deltaY < 0.05)) {
        score += 0.16; // Outward salute motion bonus
      }
      scores["HELLO"] = Math.min(0.96, score);
    }

    // ================= 2. THANK YOU =================
    // Flat hand starting at chin/lips, moving forward/outward towards viewer
    if (isOpenHand && distToChin < 0.95 && wrist.y < chestCenter.y) {
      let score = 0.78;
      if (movement.speed > 0.12 && movement.deltaY > 0.04) {
        score += 0.18; // Forward/downward arc from chin
      }
      scores["THANK YOU"] = Math.min(0.96, score);
    }

    // ================= 3. PLEASE =================
    // Open flat hand placed flat on center of chest
    if (isOpenHand && distToChest < 0.65) {
      let score = 0.84;
      if (movement.speed > 0.08) {
        score += 0.12; // Circular rubbing motion on chest
      }
      scores["PLEASE"] = Math.min(0.96, score);
    }

    // ================= 4. SORRY =================
    // 'A' fist placed directly on chest rubbing circular motion
    if (isFist && fingers.thumb && distToChest < 0.70) {
      scores["SORRY"] = 0.91;
    }

    // ================= 5. YES =================
    // 'S' fist at chest height nodding up and down
    if (isFist && !fingers.thumb && distToChest < 1.1 && wrist.y < chestCenter.y + 0.1) {
      let score = 0.76;
      if (movement.speed > 0.10 && Math.abs(movement.deltaY) > 0.05) {
        score += 0.20; // Up and down nodding motion
      }
      scores["YES"] = Math.min(0.96, score);
    }

    // ================= 6. NO =================
    // Index and middle fingers snapping or touching thumb at chest level
    if (pinches.indexThumb < 0.55 && pinches.middleThumb < 0.65 && !fingers.ring && !fingers.pinky && distToChest < 1.2) {
      scores["NO"] = 0.91;
    }

    // ================= 7. HELP =================
    // Two-handed: Non-dominant flat palm up, dominant fist resting on top lifting together
    if (isTwoHanded && nonDomHand) {
      const handDist = dist2D(domHand.wrist, nonDomHand.wrist) / torsoScale;
      if (handDist < 0.75 && (domHand.isFist || nonDomHand.isFist) && (domHand.isOpenHand || nonDomHand.isOpenHand)) {
        scores["HELP"] = 0.93;
      }
    }

    // ================= 8. STOP =================
    // Two-handed: Dominant hand chops down onto flat non-dominant palm
    if (isTwoHanded && nonDomHand) {
      const handDist = dist2D(domHand.wrist, nonDomHand.wrist) / torsoScale;
      if (handDist < 0.60 && domHand.isOpenHand && nonDomHand.isOpenHand) {
        scores["STOP"] = 0.92;
      }
    }

    // ================= 9. MORE =================
    // Both hands flattened 'O' shape tapping together in front of chest
    if (isTwoHanded && nonDomHand) {
      const handDist = dist2D(domHand.indexTip, nonDomHand.indexTip) / torsoScale;
      if (handDist < 0.50 && !domHand.isOpenHand && !nonDomHand.isOpenHand) {
        scores["MORE"] = 0.90;
      }
    }

    // ================= 10. EAT / FOOD =================
    // Pinched fingertips touching or brought directly to mouth
    if (distToMouth < 0.65 && (pinches.indexThumb < 0.6 || !isOpenHand)) {
      scores["EAT"] = 0.92;
    }

    // ================= 11. DRINK / WATER =================
    // 'W' handshape (index, middle, ring up) tapping chin
    if (fingers.index && fingers.middle && fingers.ring && !fingers.pinky && distToChin < 0.8) {
      scores["WATER"] = 0.94;
    }

    // ================= 12. I LOVE YOU =================
    // Thumb + Index + Pinky extended; Middle and Ring curled
    if (fingers.thumb && fingers.index && !fingers.middle && !fingers.ring && fingers.pinky) {
      scores["I LOVE YOU"] = 0.97;
    }

    // ================= 13. OKAY =================
    // 'OK' handshape: Index and thumb touching, middle, ring, pinky extended
    if (pinches.indexThumb < 0.50 && fingers.middle && fingers.ring && fingers.pinky && distToChest < 1.2) {
      scores["OKAY"] = 0.92;
    }

    // ================= 14. I / ME =================
    // Index finger pointing directly to own chest
    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      const indexToChest = dist2D(indexTip, chestCenter) / torsoScale;
      if (indexToChest < 0.50) {
        scores["I"] = 0.92;
      }
    }

    // ================= 15. YOU =================
    // Index finger pointing outward toward camera
    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      const indexToChest = dist2D(indexTip, chestCenter) / torsoScale;
      if (indexToChest >= 0.50 && distToChest < 1.3 && wrist.y < chestCenter.y + 0.15) {
        scores["YOU"] = 0.88;
      }
    }

    // ================= 16. WHAT =================
    // Two open hands palms up shaking horizontally
    if (isTwoHanded && nonDomHand && domHand.isOpenHand && nonDomHand.isOpenHand) {
      const handsApart = dist2D(domHand.wrist, nonDomHand.wrist) / torsoScale;
      if (handsApart > 0.8 && handsApart < 2.2) {
        scores["WHAT"] = 0.89;
      }
    }

    // ================= 17. WHERE =================
    // Single index finger upright wiggling side to side
    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky && distToChest < 1.1) {
      if (movement.speed > 0.12 && Math.abs(movement.deltaX) > 0.06) {
        scores["WHERE"] = 0.91;
      }
    }

    // ================= 18. GOOD =================
    // Flat hand touches chin then moves down into open palm or forward
    if (isOpenHand && distToChin < 0.75 && movement.deltaY > 0.08) {
      scores["GOOD"] = 0.88;
    }

    // ================= 19. BAD =================
    // Hand touches chin then flips decisively downward
    if (distToChin < 0.85 && movement.deltaY > 0.15) {
      scores["BAD"] = 0.86;
    }

    // ================= 20. HAPPY =================
    // Both hands brushing upward on chest
    if (isTwoHanded && domHand.isOpenHand && nonDomHand && nonDomHand.isOpenHand && movement.deltaY < -0.06) {
      scores["HAPPY"] = 0.90;
    }

    // ================= 21. UNDERSTAND =================
    // Index finger flicks up near temple
    if (distToForehead < 0.85 && fingers.index && !fingers.middle) {
      scores["UNDERSTAND"] = 0.91;
    }

    // ================= 22. WANT =================
    // Clawed hands pulling toward body
    if (isTwoHanded && domHand.wrist.y > chestCenter.y - 0.1 && movement.deltaY > 0.04) {
      scores["WANT"] = 0.87;
    }

    // ================= 23. NEED =================
    // Bent index finger hooked moving downward at wrist
    if (!fingers.middle && !fingers.ring && !fingers.pinky && movement.deltaY > 0.08 && distToChest < 1.0) {
      scores["NEED"] = 0.88;
    }

    // ================= 24. NICE TO MEET YOU =================
    if (isTwoHanded && nonDomHand) {
      const handDist = dist2D(domHand.wrist, nonDomHand.wrist) / torsoScale;
      if (handDist < 0.45 && domHand.fingers.index && nonDomHand.fingers.index) {
        scores["NICE TO MEET YOU"] = 0.91;
      }
    }
  }

  reset() {
    this.frameBuffer = [];
    this.stablePrediction = null;
    this.stableCount = 0;
    this.smoothedScores = {};
  }
}
