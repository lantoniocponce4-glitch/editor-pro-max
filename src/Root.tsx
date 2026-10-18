import {Composition, Folder} from "remotion";

// Compositions
import {ShowcaseComposition} from "./compositions/Showcase";
import {Saltarina, SALTARINA_DURATION} from "./compositions/Saltarina";
import {Cumpleanos, CUMPLEANOS_DURATION} from "./compositions/Cumpleanos";
import {CumpleanosReal, CUMPLEANOS_REAL_DURATION} from "./compositions/CumpleanosReal";
import {DramaFitLife, DRAMA_DURATION} from "./compositions/DramaFitLife";
import {SerieEp1, EP1_DURATION} from "./compositions/serie/Ep1";
import {SerieEp2, EP2_DURATION} from "./compositions/serie/Ep2";
import {SerieEp3, EP3_DURATION} from "./compositions/serie/Ep3";

// Social templates
import {TikTokVideo} from "./templates/social/TikTokVideo";
import {InstagramReel} from "./templates/social/InstagramReel";
import {YouTubeShort} from "./templates/social/YouTubeShort";

// Content templates
import {Presentation} from "./templates/content/Presentation";
import {Testimonial} from "./templates/content/Testimonial";

// Promo templates
import {Announcement} from "./templates/promo/Announcement";
import {BeforeAfterDemo} from "./compositions/BeforeAfterDemo";

// Editing templates
import {TalkingHeadEdit, calculateTalkingHeadMetadata} from "./templates/editing/TalkingHeadEdit";
import {PodcastClip, calculatePodcastClipMetadata} from "./templates/editing/PodcastClip";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Examples">
        <Composition
          id="SerieEp3"
          component={SerieEp3}
          durationInFrames={EP3_DURATION}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{el: "Luis", ella: "Cynia", mascota: "Bruno", music: true}}
        />
        <Composition
          id="SerieEp2"
          component={SerieEp2}
          durationInFrames={EP2_DURATION}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{el: "Luis", ella: "Cynia", mascota: "Bruno", music: true}}
        />
        <Composition
          id="SerieEp1"
          component={SerieEp1}
          durationInFrames={EP1_DURATION}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{el: "Luis", ella: "Cynia", mascota: "Bruno", music: true}}
        />
        <Composition
          id="DramaFitLife"
          component={DramaFitLife}
          durationInFrames={DRAMA_DURATION}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{el: "Luis", ella: "Cynia", mascota: "Bruno", music: true}}
        />
        <Composition
          id="CumpleanosReal"
          component={CumpleanosReal}
          durationInFrames={CUMPLEANOS_REAL_DURATION}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{nombre: "Cynia", mascota: "Bruno", music: true}}
        />
        <Composition
          id="Cumpleanos"
          component={Cumpleanos}
          durationInFrames={CUMPLEANOS_DURATION}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            nombre: "Cynia",
            mascota: "Bruno",
            foto: "cumpleanos/foto.jpg",
            fotoSize: [1512, 2016] as [number, number],
            fotoCarino: [170, 760, 600, 640] as [number, number, number, number],
            music: true,
            bruno3d: true,
          }}
        />
        <Composition
          id="Saltarina"
          component={Saltarina}
          durationInFrames={SALTARINA_DURATION}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{music: true}}
        />
        <Composition
          id="Showcase"
          component={ShowcaseComposition}
          durationInFrames={300}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>

      <Folder name="Social">
        <Composition
          id="TikTok"
          component={TikTokVideo}
          durationInFrames={270}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            hook: "Did you know this?",
            body: "AI can edit videos now using just code.",
            cta: "Follow for more",
          }}
        />
        <Composition
          id="InstagramReel"
          component={InstagramReel}
          durationInFrames={240}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline: "Your headline here",
            subtext: "Supporting text goes here",
            brandName: "Brand",
          }}
        />
        <Composition
          id="YouTubeShort"
          component={YouTubeShort}
          durationInFrames={300}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            title: "Your Title Here",
            subtitle: "Subtitle goes here",
          }}
        />
      </Folder>

      <Folder name="Content">
        <Composition
          id="Presentation"
          component={Presentation}
          durationInFrames={450}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            slides: [
              {title: "Welcome", body: "This is slide one"},
              {title: "The Problem", body: "Here's what we're solving"},
              {title: "The Solution", body: "Here's how we solve it"},
            ],
          }}
        />
        <Composition
          id="Testimonial"
          component={Testimonial}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            quote:
              "This product completely changed how we work. Highly recommended.",
            author: "Jane Doe",
            role: "CEO at Company",
          }}
        />
      </Folder>

      <Folder name="Promo">
        <Composition
          id="Announcement"
          component={Announcement}
          durationInFrames={300}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            preTitle: "Introducing",
            title: "Something Amazing",
            subtitle: "The future is here",
            cta: "Learn More",
          }}
        />
        <Composition
          id="BeforeAfter"
          component={BeforeAfterDemo}
          durationInFrames={180}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>

      <Folder name="Editing">
        <Composition
          id="TalkingHeadEdit"
          component={TalkingHeadEdit}
          calculateMetadata={calculateTalkingHeadMetadata}
          durationInFrames={900}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            videoSrc: "assets/video.mp4",
            showCaptions: true,
            captionPreset: "bold" as const,
            removeSilence: false,
          }}
        />
        <Composition
          id="PodcastClip"
          component={PodcastClip}
          calculateMetadata={calculatePodcastClipMetadata}
          durationInFrames={900}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            videoSrc: "assets/video.mp4",
            clipStartSeconds: 0,
            clipEndSeconds: 30,
            showCaptions: true,
            captionPreset: "bold" as const,
          }}
        />
      </Folder>
    </>
  );
};
