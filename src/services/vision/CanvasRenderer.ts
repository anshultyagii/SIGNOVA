import type { HolisticResults } from '../../types/mediapipe';
import type { ProcessedFrame } from '../../types/landmarks';

export interface RenderOptions {
  showFace: boolean;
  showPose: boolean;
  showHands: boolean;
  showAngles: boolean;
  showTrails: boolean;
  showBoxes: boolean;
  mirror: boolean;
}

export class CanvasRenderer {
  private wristTrails: { left: { x: number; y: number }[]; right: { x: number; y: number }[] } = {
    left: [],
    right: [],
  };

  /**
   * Main render loop for the overlay canvas
   */
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    results: HolisticResults,
    processedFrame: ProcessedFrame | null,
    options: RenderOptions
  ): void {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    if (options.mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // 1. Draw Wrist Motion Trails
    if (options.showTrails && processedFrame) {
      this.updateAndDrawTrails(ctx, width, height, processedFrame);
    }

    // 2. Draw Upper Body / Pose (All Arm Kinematics)
    if (options.showPose && results.poseLandmarks && results.poseLandmarks.length > 0) {
      this.drawPoseAndArms(ctx, width, height, results.poseLandmarks, processedFrame, options);
    }

    // 3. Draw Hands
    if (options.showHands) {
      if (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) {
        this.drawHand(ctx, width, height, results.leftHandLandmarks, 'left', options);
      }
      if (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) {
        this.drawHand(ctx, width, height, results.rightHandLandmarks, 'right', options);
      }
    }

    // 4. Draw Face Gestures / Face Mesh
    if (options.showFace && results.faceLandmarks && results.faceLandmarks.length > 0) {
      this.drawFace(ctx, width, height, results.faceLandmarks);
    }

    ctx.restore();
  }

  private updateAndDrawTrails(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frame: ProcessedFrame
  ): void {
    const lw = frame.kinematics.leftArm.wristPosition;
    const rw = frame.kinematics.rightArm.wristPosition;

    if (lw.x > 0 && lw.y > 0) {
      this.wristTrails.left.push({ x: lw.x * width, y: lw.y * height });
      if (this.wristTrails.left.length > 14) this.wristTrails.left.shift();
    }
    if (rw.x > 0 && rw.y > 0) {
      this.wristTrails.right.push({ x: rw.x * width, y: rw.y * height });
      if (this.wristTrails.right.length > 14) this.wristTrails.right.shift();
    }

    // Amber glowing trails
    this.drawTrailPath(ctx, this.wristTrails.left, 'rgba(232, 161, 61, ');
    this.drawTrailPath(ctx, this.wristTrails.right, 'rgba(255, 191, 92, ');
  }

  private drawTrailPath(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    colorPrefix: string
  ): void {
    if (points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      const alpha = (i / points.length) * 0.55;
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = `${colorPrefix}${alpha})`;
      ctx.lineWidth = 1.5 + (i / points.length) * 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  private drawPoseAndArms(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    pose: any[],
    frame: ProcessedFrame | null,
    options: RenderOptions
  ): void {
    const toPx = (pt: any) => ({ x: pt.x * width, y: pt.y * height });

    // Shoulders bar
    if (pose[11] && pose[12]) {
      const ls = toPx(pose[11]);
      const rs = toPx(pose[12]);
      ctx.beginPath();
      ctx.moveTo(ls.x, ls.y);
      ctx.lineTo(rs.x, rs.y);
      ctx.strokeStyle = '#3a3428';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Left Arm: 11 (shoulder) -> 13 (elbow) -> 15 (wrist)
    if (pose[11] && pose[13] && pose[15]) {
      const s = toPx(pose[11]);
      const e = toPx(pose[13]);
      const w = toPx(pose[15]);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.lineTo(w.x, w.y);
      ctx.strokeStyle = '#e8a13d';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      this.drawJoint(ctx, s.x, s.y, '#e8a13d', 5);
      this.drawJoint(ctx, e.x, e.y, '#e8a13d', 5.5);
      this.drawJoint(ctx, w.x, w.y, '#ffbf5c', 6);

      if (options.showAngles && frame) {
        this.drawAngleBadge(ctx, e.x, e.y, `${frame.kinematics.leftArm.elbowAngle}°`);
      }
    }

    // Right Arm: 12 (shoulder) -> 14 (elbow) -> 16 (wrist)
    if (pose[12] && pose[14] && pose[16]) {
      const s = toPx(pose[12]);
      const e = toPx(pose[14]);
      const w = toPx(pose[16]);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.lineTo(w.x, w.y);
      ctx.strokeStyle = '#e8a13d';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      this.drawJoint(ctx, s.x, s.y, '#e8a13d', 5);
      this.drawJoint(ctx, e.x, e.y, '#e8a13d', 5.5);
      this.drawJoint(ctx, w.x, w.y, '#ffbf5c', 6);

      if (options.showAngles && frame) {
        this.drawAngleBadge(ctx, e.x, e.y, `${frame.kinematics.rightArm.elbowAngle}°`);
      }
    }
  }

  private drawHand(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    landmarks: any[],
    side: 'left' | 'right',
    options: RenderOptions
  ): void {
    const baseColor = '#e8a13d';
    const accentColor = '#ffbf5c';

    // 21-point hand topology connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17],                              // Palm
    ];

    // Draw bones
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const [i, j] of connections) {
      if (landmarks[i] && landmarks[j]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[i].x * width, landmarks[i].y * height);
        ctx.lineTo(landmarks[j].x * width, landmarks[j].y * height);
        ctx.stroke();
      }
    }

    // Draw joints and fingertips
    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let i = 0; i < landmarks.length; i++) {
      const x = landmarks[i].x * width;
      const y = landmarks[i].y * height;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.beginPath();
      ctx.arc(x, y, isTip ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#ffffff' : accentColor;
      ctx.fill();
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Optional Bounding Box
    if (options.showBoxes) {
      const padding = 10;
      const bx = minX - padding;
      const by = minY - padding;
      const bw = maxX - minX + padding * 2;
      const bh = maxY - minY + padding * 2;

      ctx.strokeStyle = '#3a3428';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      const label = side === 'left' ? 'LEFT' : 'RIGHT';
      ctx.font = '9px monospace';
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(bx, by - 14, ctx.measureText(label).width + 6, 13);
      ctx.fillStyle = '#e8a13d';
      ctx.fillText(label, bx + 3, by - 4);
    }
  }

  private drawFace(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    face: any[]
  ): void {
    const lips = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
    const leftEye = [33, 160, 158, 133, 153, 144, 33];
    const rightEye = [263, 387, 385, 362, 380, 373, 263];
    const leftBrow = [70, 63, 105, 66, 107];
    const rightBrow = [300, 293, 334, 296, 336];

    const drawPath = (indices: number[], color: string, lineWidth = 1.2, close = true) => {
      ctx.beginPath();
      let first = true;
      for (const idx of indices) {
        if (face[idx]) {
          const x = face[idx].x * width;
          const y = face[idx].y * height;
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      if (close) ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    drawPath(leftEye, 'rgba(232, 161, 61, 0.4)', 1.2);
    drawPath(rightEye, 'rgba(232, 161, 61, 0.4)', 1.2);
    drawPath(leftBrow, 'rgba(232, 161, 61, 0.5)', 1.5, false);
    drawPath(rightBrow, 'rgba(232, 161, 61, 0.5)', 1.5, false);
    drawPath(lips, 'rgba(232, 161, 61, 0.65)', 1.5);

    // Sample key facial landmarks as subtle golden micro-dots
    const samples = [1, 10, 152, 234, 454];
    ctx.fillStyle = 'rgba(255, 191, 92, 0.5)';
    for (const idx of samples) {
      if (face[idx]) {
        ctx.beginPath();
        ctx.arc(face[idx].x * width, face[idx].y * height, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawJoint(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawAngleBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    ctx.font = 'bold 10px monospace';
    const textWidth = ctx.measureText(text).width;
    const badgeW = textWidth + 10;
    const badgeH = 16;
    const bx = x + 8;
    const by = y - 8;

    ctx.fillStyle = '#1a1a1a';
    ctx.strokeStyle = '#3a3428';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e8a13d';
    ctx.fillText(text, bx + 5, by + 12);
  }
}
