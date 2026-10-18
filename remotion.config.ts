import {Config} from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL con ANGLE: necesario para los personajes 3D (@remotion/three), p. ej. Bruno en Cumpleanos
Config.setChromiumOpenGlRenderer("angle");
