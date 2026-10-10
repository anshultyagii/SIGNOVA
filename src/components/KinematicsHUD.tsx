import React from 'react';
import {
  Compass,
  Hand,
  Smile,
  Activity,
  ArrowUpDown,
  MoveHorizontal,
} from 'lucide-react';
import type { KinematicsSummary, HandShape } from '../types/landmarks';

interface KinematicsHUDProps {
  kinematics: KinematicsSummary | null;
}

export const KinematicsHUD: React.FC<KinematicsHUDProps> = ({ kinematics }) => {
  const formatShape = (shape: HandShape) => {
    switch (shape) {
      case 'i_love_you':
        return '🤟 I LOVE YOU';
      case 'call_me':
        return '🤙 CALL ME';
      case 'thumbs_up':
        return '👍 THUMBS UP';
      case 'victory':
        return '✌️ VICTORY / V';
      case 'pinch':
        return '🤏 PINCH';
      case 'open':
        return '✋ OPEN PALM';
      case 'fist':
        return '✊ FIST';
      case 'point':
        return '👉 POINT';
      default:
        return '— NONE';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Live Kinematics & Gesture Telemetry
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Full Arm • Hands • Face
        </span>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Section 1: Upper Body & Arm Kinematics */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium text-cyan-400">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Arm Kinematics (All Joints)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">0°-180°</span>
          </div>

          {/* Left Arm */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Left Elbow Angle</span>
              <span className="font-mono font-bold text-cyan-300">
                {kinematics ? `${kinematics.leftArm.elbowAngle}°` : '—'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-150"
                style={{
                  width: `${kinematics ? Math.min(100, (kinematics.leftArm.elbowAngle / 180) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Elevation:</span>
              <span
                className={`font-medium ${
                  kinematics?.leftArm.isRaised ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {kinematics ? (kinematics.leftArm.isRaised ? 'Raised' : 'Neutral') : '—'}
              </span>
            </div>
          </div>

          {/* Right Arm */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Right Elbow Angle</span>
              <span className="font-mono font-bold text-purple-300">
                {kinematics ? `${kinematics.rightArm.elbowAngle}°` : '—'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 transition-all duration-150"
                style={{
                  width: `${kinematics ? Math.min(100, (kinematics.rightArm.elbowAngle / 180) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Elevation:</span>
              <span
                className={`font-medium ${
                  kinematics?.rightArm.isRaised ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {kinematics ? (kinematics.rightArm.isRaised ? 'Raised' : 'Neutral') : '—'}
              </span>
            </div>
          </div>

          {/* Inter-wrist distance */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
            <span className="flex items-center gap-1">
              <MoveHorizontal className="w-3 h-3 text-slate-500" />
              Wrist Span
            </span>
            <span className="font-mono text-slate-300">
              {kinematics ? `${(kinematics.handDistance * 100).toFixed(0)} cm` : '—'}
            </span>
          </div>
        </div>

        {/* Section 2: Hand Gestures */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium text-amber-400">
            <span className="flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              Dual Hand Topology
            </span>
            <span className="text-[10px] text-slate-500 font-mono">21 Pts/Hand</span>
          </div>

          {/* Left Hand */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Left Hand:</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  kinematics?.leftHand.detected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {kinematics?.leftHand.detected ? 'TRACKED' : 'NOT DETECTED'}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-200 mt-1">
              {kinematics?.leftHand.detected ? formatShape(kinematics.leftHand.shape) : '—'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Extended Fingers:</span>
              <span className="font-mono text-slate-300">
                {kinematics?.leftHand.detected ? `${kinematics.leftHand.openFingersCount}/5` : '—'}
              </span>
            </div>
          </div>

          {/* Right Hand */}
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Right Hand:</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  kinematics?.rightHand.detected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {kinematics?.rightHand.detected ? 'TRACKED' : 'NOT DETECTED'}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-200 mt-1">
              {kinematics?.rightHand.detected ? formatShape(kinematics.rightHand.shape) : '—'}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Extended Fingers:</span>
              <span className="font-mono text-slate-300">
                {kinematics?.rightHand.detected ? `${kinematics.rightHand.openFingersCount}/5` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Face Gestures */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-400">
            <span className="flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5" />
              Facial Gestures & Mesh
            </span>
            <span className="text-[10px] text-slate-500 font-mono">468 Pts</span>
          </div>

          {/* Mouth Aperture */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Mouth Aperture</span>
              <span className="font-mono text-indigo-300 font-semibold">
                {kinematics ? `${(kinematics.face.mouthOpenRatio * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-150"
                style={{
                  width: `${kinematics ? Math.min(100, kinematics.face.mouthOpenRatio * 200) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Expression:</span>
              <span className="text-slate-300">
                {kinematics
                  ? kinematics.face.mouthOpenRatio > 0.35
                    ? 'Open / Vocalizing'
                    : 'Resting'
                  : '—'}
              </span>
            </div>
          </div>

          {/* Smile / Mouth width */}
          <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Lip Curvature / Smile</span>
              <span className="font-mono text-slate-300">
                {kinematics ? `${(kinematics.face.smileRatio * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
          </div>

          {/* Head Tilt */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/50">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              Head Pitch / Roll
            </span>
            <span className="font-mono text-slate-300">
              {kinematics ? `${kinematics.face.headTiltX > 0 ? 'Down' : 'Up'} (${kinematics.face.headTiltZ}°)` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
