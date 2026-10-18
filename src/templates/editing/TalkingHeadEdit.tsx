import React from "react";
import {AbsoluteFill, Sequence, staticFile, type CalculateMetadataFunction} from "remotion";
import {VideoClip} from "../../components/media/VideoClip";
import {JumpCut, calculateJumpCutDuration, type Segment} from "../../components/media/JumpCut";
import {CaptionOverlay, type CaptionPreset} from "../../components/text/CaptionOverlay";
import {AnimatedTitle} from "../../components/text/AnimatedTitle";
import {LowerThird} from "../../components/text/LowerThird";
import {CallToAction} from "../../components/overlays/CallToAction";
import {ProgressBar} from "../../components/overlays/ProgressBar";
import {AudioTrack} from "../../components/media/AudioTrack";
import {useSilenceSegments} from "../../hooks/useSilenceSegments";
import {buildCutList, mergeSegments} from "../../utils/editing";
import {Watermark} from "../../components/overlays/Watermark";
import {loadDefaultFonts} from "../../presets/fonts";
import {BRAND} from "../../presets/brand";

export type TalkingHeadEditProps = {
  videoSrc?: string;
  captionsPath?: string;
  silencePath?: string;
  removeSilence?: boolean;
  showCaptions?: boolean;
  captionPreset?: CaptionPreset;
  title?: string;
  titleDuration?: number;
  speakerName?: string;
  speakerTitle?: string;
  ctaText?: string;
  ctaDuration?: number;
  backgroundMusic?: string;
  musicVolume?: number;
  accentColor?: string;
};

/** Cut list used when removeSilence is on (shared by the component and calculateMetadata) */
const buildTalkingHeadCuts = (speechSegments: Segment[]): Segment[] =>
  mergeSegments(buildCutList(speechSegments, {paddingSeconds: 0.15}), 0.3);

/**
 * Sets the composition length to match the footage: the cut length when removeSilence
 * is on, otherwise the full video length from video-metadata.json. Keeps the
 * registered duration if neither file can be read.
 */
export const calculateTalkingHeadMetadata: CalculateMetadataFunction<TalkingHeadEditProps> = async ({props}) => {
  const fps = 30;
  try {
    if (props.removeSilence && props.silencePath) {
      const raw = await fetch(staticFile(props.silencePath)).then((r) => r.json());
      const speech: Segment[] = (raw.speechSegments ?? []).map((x: {start?: number; end?: number; startSeconds?: number; endSeconds?: number}) => ({
        startSeconds: x.startSeconds ?? x.start ?? 0,
        endSeconds: x.endSeconds ?? x.end ?? 0,
      }));
      const frames = calculateJumpCutDuration(buildTalkingHeadCuts(speech), fps, 0);
      if (frames > 0) return {durationInFrames: frames};
    }
    const meta = await fetch(staticFile("video-metadata.json")).then((r) => r.json());
    if (meta?.duration > 0) return {durationInFrames: Math.round(meta.duration * fps)};
  } catch {
    // No pipeline output yet: keep the registered duration
  }
  return {};
};

export const TalkingHeadEdit: React.FC<TalkingHeadEditProps> = ({
  videoSrc = "assets/video.mp4",
  captionsPath,
  silencePath,
  removeSilence = false,
  showCaptions = true,
  captionPreset = "bold",
  title,
  titleDuration = 90,
  speakerName,
  speakerTitle,
  ctaText,
  ctaDuration = 90,
  backgroundMusic,
  musicVolume = 0.15,
  accentColor = "#6366f1",
}) => {
  loadDefaultFonts();

  const silenceData = useSilenceSegments(silencePath ?? null);

  // Build cut list from speech segments
  const segments = silenceData
    ? buildTalkingHeadCuts(silenceData.speechSegments)
    : [];

  const src = staticFile(videoSrc);

  return (
    <AbsoluteFill>
      {/* Video layer — either jump-cut or full */}
      {removeSilence && segments.length > 0 ? (
        <JumpCut src={src} segments={segments} paddingSeconds={0} />
      ) : (
        <VideoClip src={src} />
      )}

      {/* Captions */}
      {showCaptions && captionsPath && (
        <CaptionOverlay
          captionsSource={captionsPath}
          preset={captionPreset}
          position="bottom"
          cutSegments={removeSilence && segments.length > 0 ? segments : undefined}
          // Sit above the call-to-action button, which is anchored 80px from the bottom
          style={ctaText ? {bottom: 200} : undefined}
        />
      )}

      {/* Title overlay at start */}
      {title && (
        <Sequence from={0} durationInFrames={titleDuration}>
          <AbsoluteFill style={{justifyContent: "center", alignItems: "center"}}>
            <AnimatedTitle
              text={title}
              fontSize={56}
              fontWeight={800}
              color="#ffffff"
              enterAnimation="scale"
              exitAnimation="fade"
              enterDuration={20}
              holdDuration={titleDuration - 40}
              exitDuration={15}
              textShadow={`0 4px 20px ${accentColor}40`}
            />
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Lower third */}
      {speakerName && (
        <Sequence from={title ? titleDuration - 10 : 15} durationInFrames={150}>
          <LowerThird
            name={speakerName}
            title={speakerTitle}
            accentColor={accentColor}
            enterDuration={20}
            holdDuration={90}
            exitDuration={15}
          />
        </Sequence>
      )}

      {/* CTA at the end */}
      {ctaText && (
        <Sequence from={0}>
          <CallToAction
            text={ctaText}
            backgroundColor={accentColor}
            enterDelay={Math.max(0, (removeSilence && segments.length > 0
              ? segments.reduce((sum, s) => sum + (s.endSeconds - s.startSeconds), 0) * 30
              : 200) - ctaDuration)}
          />
        </Sequence>
      )}

      {/* Background music */}
      {backgroundMusic && (
        <AudioTrack
          src={staticFile(backgroundMusic)}
          volume={musicVolume}
          fadeInDurationSeconds={2}
          fadeOutDurationSeconds={3}
          loop
        />
      )}

      {/* Progress bar */}
      <ProgressBar color={accentColor} height={3} />

      {/* Brand watermark */}
      <Watermark text={BRAND.handle} corner="topRight" opacity={0.5} fontSize={14} color="#ffffff" margin={30} />
    </AbsoluteFill>
  );
};
